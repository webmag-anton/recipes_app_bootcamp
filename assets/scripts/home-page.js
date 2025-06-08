let $main = undefined
let $recipes = undefined
let $creationalForm = undefined
let $nothingFoundAlert = undefined
let currentFoundRecipes = []
let nextRecipesPageURL = null

document.addEventListener('DOMContentLoaded', () => {
  const $searchFilter = document.getElementById('search-filter')
  $main = document.getElementById('main')
  $recipes = $main.querySelector('#found-recipes')
  $creationalForm = document.getElementById('create-recipe-form')

  App.renderPreviousSearchResults()
  $searchFilter.addEventListener('submit', Handlers.searchSubmitHandler)
  $creationalForm.addEventListener('submit', Handlers.createSubmitHandler)
})

const App = {
  renderPreviousSearchResults() {
    const cached = sessionStorage.getItem(CONFIG.foundRecipesKey)
    if (cached) Render.recipes(JSON.parse(cached))
  }
}

const Handlers = {
  async searchSubmitHandler(event) {
    event.preventDefault()

    const url = new URL(CONFIG.recipesAPI)
    const params = new URLSearchParams(url.search)
    params.append('type', 'public')
    params.append('app_id', CONFIG.appID)
    params.append('app_key', CONFIG.appKey)

    const $searchControls = this.getElementsByTagName('input')

    Array.from($searchControls).forEach(item => {
      if (item.type === 'text') {
        params.append('q', item.value.trim())
      } else if (item.type === 'checkbox' && item.checked) {
        switch (item.dataset.searchType) {
          case 'diet': params.append('diet', item.name); break
          case 'health': params.append('health', item.name)
        }
      }
    })

    let kcalMinVal = $searchControls['kcal-min'].value
    let kcalMaxVal = $searchControls['kcal-max'].value

    if (kcalMinVal && !kcalMaxVal) {
      params.append('calories', `${kcalMinVal}+`)
    } else if (kcalMinVal && kcalMaxVal) {
      if (+kcalMaxVal <= +kcalMinVal) {
        kcalMaxVal = +kcalMinVal + 100
        $searchControls['kcal-max'].value = kcalMaxVal
      }
      params.append('calories', `${kcalMinVal}-${kcalMaxVal}`)
    } else if (!kcalMinVal && kcalMaxVal) {
      params.append('calories', `${kcalMaxVal}`)
    }

    const requestUrl = `${url}${params}`
    const fetchedRecipes = await API.fetchData(requestUrl)

    if (!fetchedRecipes?.hits?.length) {
      if (!$nothingFoundAlert) Render.notFound()
    } else {
      if ($nothingFoundAlert) {
        $nothingFoundAlert.remove()
        $nothingFoundAlert = undefined
      }
      Render.recipes(fetchedRecipes)
    }

    sessionStorage.setItem(CONFIG.foundRecipesKey, JSON.stringify(fetchedRecipes))
  },

  createSubmitHandler(event) {
    event.preventDefault()

    let existingOwnRecipes = localStorage.getItem(CONFIG.ownRecipesKey)
    existingOwnRecipes = existingOwnRecipes ? JSON.parse(existingOwnRecipes) : []

    const formData = new FormData($creationalForm)
    const recipe = {
      label: formData.get('recipe-name')?.trim(),
      ingredients: formData.get('ingredients')?.trim(),
      instructions: formData.get('instructions')?.trim(),
      time: formData.get('create-recipe-time'),
      weight: formData.get('create-recipe-weight'),
      diets: Utils.getCheckedCheckboxValues('#create-recipe-diets'),
      allergies: Utils.getCheckedCheckboxValues('#create-recipe-allergies'),
      creationDate: new Date().toLocaleDateString()
    }

    existingOwnRecipes.push(recipe)
    localStorage.setItem(CONFIG.ownRecipesKey, JSON.stringify(existingOwnRecipes))

    const $modal = document.getElementById('create-recipe')
    const modal = bootstrap.Modal.getInstance($modal)
    modal.hide()

    $creationalForm.reset()
    UI.showToast()
  }
}

const API = {
  async fetchData(url) {
    const $recipesContainer = $main.querySelector('#found-recipes')
    $main.insertAdjacentHTML('afterbegin', `<div class='spinner-border' role='status'><span class='visually-hidden'>Loading...</span></div>`)
    $recipesContainer.classList.add('invisible')

    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.json()
    } catch (err) {
      console.error('Fetch failed:', err)
      alert('Something went wrong while loading recipes. Please try again.')
    } finally {
      $main.querySelector('.spinner-border').remove()
      $recipesContainer.classList.remove('invisible')
    }
  }
}

const Render = {
  recipes(fetchedRecipes, append = false) {
    const { hits: recipes = [], _links = {} } = fetchedRecipes
    nextRecipesPageURL = _links?.next?.href || null

    if (!append) {
      currentFoundRecipes = []
      $recipes.innerHTML = ''
    }

    let template = ''
    const favouriteList = JSON.parse(localStorage.getItem(CONFIG.favouriteRecipesKey))

    recipes.forEach((item, ind) => {
      const { recipe: {
        label = '', images: { REGULAR: { url: imageUrl = '' } = {} } = {},
        cuisineType = [], dishType = [], cautions = [],
        ingredientLines = [], totalTime = '', totalWeight = '', url = ''
      } = {} } = item

      currentFoundRecipes.push({ label, imageUrl, cuisineType, dishType, cautions, ingredientLines, totalTime, totalWeight, url })

      template += `
        <div class='col'>
          <div class='card found-item' data-label='${label}'>
            <img src='${imageUrl}' class='card-img-top' alt='${label}'>
            <div class='card-body'>
              <h5 class='card-title'>${label}</h5>
              <button type='button' class='btn btn-warning btn-favourite ml-auto'>
                <i class='${favouriteList?.findIndex(item => item.label === label) > -1 ? 'fa-solid' : 'fa-regular'} fa-star'></i>
              </button>
              <ul class='list-group list-group-flush'>
                <li class='list-group-item'>
                  ${dishType.map(dish => `<span class='badge text-bg-dark d-inline-block mb-1'>${dish}</span>`).join('')}
                  ${cuisineType.map(cuisine => `<span class='badge text-bg-success d-inline-block mb-1'>${cuisine}</span>`).join('')}
                </li>
                <li class='list-group-item'>
                  <span class='badge text-bg-secondary'>cooking time: ${totalTime} min</span>
                </li>
                <li class='list-group-item'>
                  <span class='badge text-bg-secondary'>total weight: ${Math.round(totalWeight)} g</span>
                </li>
                <li class='list-group-item'>
                  ${cautions.map(caution => `<span class='badge text-bg-danger d-inline-block'>${caution}</span>`).join('')}
                </li>
              </ul>
  
              <div class='accordion mt-2 mb-2' id='accordion_${ind}'>
                <div class='accordion-item'>
                  <h2 class='accordion-header'>
                    <button class='accordion-button' type='button' data-bs-toggle='collapse' data-bs-target='#collapse-${ind}' aria-expanded='true' aria-controls='collapse-${ind}'>
                      Ingredient:
                    </button>
                  </h2>
                  <div id='collapse-${ind}' class='accordion-collapse collapse' data-bs-parent='#accordion_${ind}'>
                    <div class='accordion-body'>
                      ${ingredientLines.map(ingredient => `<p class='mb-1'>- ${ingredient}</p>`).join('')}
                    </div>
                  </div>
                </div>
              </div>
  
              <a href='${url}' class='btn btn-dark recipe-link' target='_blank'>recipe <i class="fa-solid fa-link"></i></a>
            </div>
          </div>
        </div>
      `
    })

    $recipes.insertAdjacentHTML('beforeend', template)
    UI.addCardClickListener()
    UI.renderShowMoreButton()
  },

  notFound() {
    document.getElementById('show-more-btn')?.remove()
    $main.insertAdjacentHTML('beforeend', `
      <div class='alert alert-warning nothing-found-alert' role='alert'>No recipes found =( <br> Try to modify your filter settings! 😃</div>`)
    currentFoundRecipes = []
    $recipes.innerHTML = ''
    $nothingFoundAlert = $main.querySelector('.nothing-found-alert')
  }
}

const UI = {
  renderShowMoreButton() {
    document.getElementById('show-more-btn')?.remove()

    if (nextRecipesPageURL) {
      $main.insertAdjacentHTML('beforeend', `<div class="text-center my-4"><button id="show-more-btn" class="btn btn-primary">Show more</button></div>`)
      document.getElementById('show-more-btn')?.addEventListener('click', async () => {
        const nextPage = await API.fetchData(nextRecipesPageURL)
        if (nextPage?.hits?.length) Render.recipes(nextPage, true)
        else document.getElementById('show-more-btn')?.remove()
      })
    }
  },

  addCardClickListener() {
    const $searchedItems = $main.getElementsByClassName('found-item')

    Array.from($searchedItems).forEach(item => {
      const $favouriteButton = item.querySelector('.btn-favourite')

      $favouriteButton.addEventListener('click', function () {
        this.firstElementChild.classList.toggle('fa-solid')
        this.firstElementChild.classList.toggle('fa-regular')

        const label = this.closest('.found-item').dataset.label
        const index = currentFoundRecipes.findIndex(r => r.label === label)
        if (index > -1) Storage.toggleFavouriteRecipe(index)
      })
    })
  },

  showToast() {
    const toast = bootstrap.Toast.getOrCreateInstance(document.getElementById('toast'))
    toast.show()
  }
}

const Storage = {
  toggleFavouriteRecipe(index) {
    let list = []
    try {
      list = JSON.parse(localStorage.getItem(CONFIG.favouriteRecipesKey)) || []
    } catch {
      console.warn('Invalid favourite list format.')
    }

    const recipe = currentFoundRecipes[index]
    const idx = list.findIndex(r => r.label === recipe.label)

    idx > -1 ? list.splice(idx, 1) : list.push(recipe)

    localStorage.setItem(CONFIG.favouriteRecipesKey, JSON.stringify(list))
  }
}

const Utils = {
  getCheckedCheckboxValues(containerSelector) {
    return Array.from(document.querySelectorAll(`${containerSelector} input[type="checkbox"]:checked`)).map(input => input.name)
  }
}