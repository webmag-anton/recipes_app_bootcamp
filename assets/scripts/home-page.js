const CONFIG = {
  recipesAPI: 'https://api.edamam.com/api/recipes/v2?',
  appID: '3084784d',
  appKey: 'dc83d53eaf6e9bcde3a249be9b9d6ce7',
  foundRecipesKey: 'foundRecipes',
  favouriteRecipesKey: 'favouriteRecipes'
}

let $searchFilter = undefined
let $main = undefined
let $recipes = undefined
let currentFoundRecipes = []
let $nothingFoundAlert = undefined

document.addEventListener('DOMContentLoaded', () => {
  $searchFilter = document.getElementById('search-filter')
  $main = document.getElementById('main')
  $recipes = $main.querySelector('#found-recipes')

  renderPreviousSearchResults()

  $searchFilter.addEventListener('submit', searchSubmitHandler)
})

function renderPreviousSearchResults() {
  if (sessionStorage.getItem(CONFIG.foundRecipesKey)) {
    render(JSON.parse(sessionStorage.getItem(CONFIG.foundRecipesKey)))
  }
}

async function searchSubmitHandler(event) {
  event.preventDefault()

  const url = new URL(CONFIG.recipesAPI)
  let params = new URLSearchParams(url.search)
  params.append('type', 'public')
  params.append('app_id', CONFIG.appID)
  params.append('app_key', CONFIG.appKey)

  const $searchControls = this.getElementsByTagName('input')

  Array.from($searchControls).forEach(item => {
    if (item.type === 'text') {
      params.append('q', item.value.trim())
    } else if (item.type === 'checkbox' && item.checked) {
      switch (item.dataset.searchType) {
        case 'diet':
          params.append('diet', item.name)
          break
        case 'health':
          params.append('health', item.name)
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
  const fetchedRecipes = await fetchData(requestUrl)

  if (!fetchedRecipes?.hits?.length) {
    !$nothingFoundAlert && renderNotFound()
  } else {
    if ($nothingFoundAlert) {
      $nothingFoundAlert.remove()
      $nothingFoundAlert = undefined
    }
    render(fetchedRecipes)
  }

  sessionStorage.setItem(CONFIG.foundRecipesKey, JSON.stringify(fetchedRecipes))
}

async function fetchData(url) {
  const $recipesContainer = $main.querySelector('#found-recipes')
  $main.insertAdjacentHTML('afterbegin', `
      <div class='spinner-border' role='status'>
        <span class='visually-hidden'>Loading...</span>
      </div>
    `)
  $recipesContainer.classList.add('invisible')

  try {
    const response = await fetch(url)
    if (response.ok) {
      let json = await response.json()
      return json
    } else {
      console.error(`http error: status ${response.status}`)
    }
  }
  catch(err) {
    console.error(`request error`)
  }
  finally {
    $main.querySelector('.spinner-border').remove()
    $recipesContainer.classList.remove('invisible')
  }
}

function render(fetchedRecipes) {
  currentFoundRecipes = []

  let template = ''
  const { hits: recipes = [] } = fetchedRecipes

  const favouriteList = JSON.parse(localStorage.getItem(CONFIG.favouriteRecipesKey))

  recipes.forEach((item, ind) => {
    const {recipe: {
      label = '',
      images: { REGULAR: { url: imageUrl = '' } = {} } = {},
      cuisineType = [],
      dishType = [],
      cautions = [],
      ingredientLines = [],
      totalTime = '',
      totalWeight = '',
      url = ''
    } = {}} = item

    currentFoundRecipes.push({
      label,
      imageUrl,
      cuisineType,
      dishType,
      cautions,
      ingredientLines,
      totalTime,
      totalWeight,
      url
    })

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
  document.getElementById('found-recipes').innerHTML = template

  addCardClickListener()
}

function addCardClickListener() {
  const $searchedItems = $main.getElementsByClassName('found-item')

  Array.from($searchedItems).forEach(item => {
    const $favouriteButton = item.getElementsByClassName('btn-favourite')[0]

    $favouriteButton.addEventListener('click', function() {
      console.log(this.firstElementChild.classList)
      this.firstElementChild.classList.contains('fa-regular')
        ? this.firstElementChild.classList.replace('fa-regular', 'fa-solid')
        : this.firstElementChild.classList.replace('fa-solid', 'fa-regular')

      const recipeLabel = this.closest('.found-item').dataset.label
      const favouriteIndex = currentFoundRecipes.findIndex(item => item.label === recipeLabel)
      favouriteIndex > -1 && toggleFavouriteRecipe(favouriteIndex)
    })
  })
}

function toggleFavouriteRecipe(index) {
  const favouriteList = JSON.parse(localStorage.getItem(CONFIG.favouriteRecipesKey))

  if (!favouriteList || !favouriteList.length) {
    localStorage.setItem(
      'favouriteRecipes',
      JSON.stringify([currentFoundRecipes[index]])
    )
  } else {
    const recipeIndexInFavouriteList =
      favouriteList.findIndex(item => item.label === currentFoundRecipes[index].label)
    const isRecipeInFavouriteList = recipeIndexInFavouriteList > -1

    if (isRecipeInFavouriteList) {
      favouriteList.splice(recipeIndexInFavouriteList, 1)
      localStorage.setItem('favouriteRecipes', JSON.stringify(favouriteList))
    } else {
      favouriteList.push(currentFoundRecipes[index])
      localStorage.setItem('favouriteRecipes', JSON.stringify(favouriteList))
    }
  }
}

function renderNotFound() {
  $main.insertAdjacentHTML('beforeend', `
    <div class='alert alert-warning nothing-found-alert' role='alert'>
      No recipes found =( <br>
      Try to modify your filter settings! 😃
    </div>
  `)
  currentFoundRecipes = []
  $recipes.innerHTML = ''
  $nothingFoundAlert = $main.querySelector('.nothing-found-alert')
}