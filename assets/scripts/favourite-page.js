let $favouriteRecipes = undefined
let $creationalForm = undefined

document.addEventListener('DOMContentLoaded', () => {
  $favouriteRecipes = document.getElementById('favourite-recipes')
  $creationalForm = document.getElementById('create-recipe-form')

  App.renderFavouriteRecipes()
  $creationalForm.addEventListener('submit', Handlers.createSubmitHandler)
})

const App = {
  renderFavouriteRecipes() {
    const favouriteList = Storage.getFavouriteRecipes()
    if (!favouriteList || !favouriteList.length) {
      Render.noFavourites($favouriteRecipes)
    } else {
      Render.favouriteRecipes($favouriteRecipes, favouriteList)
    }
  }
}

const Render = {
  noFavourites($container) {
    $container.innerHTML = `
      <p>list of <i class="fa-solid fa-star"></i> recipes is empty :(</p>
    `
  },

  favouriteRecipes($container, favouriteList) {
    const template = favouriteList.map((item, ind) => {
      const {
        label, imageUrl, cuisineType, dishType,
        cautions, ingredientLines, totalTime, totalWeight, url
      } = item

      return `
        <div class='col'>
          <div class='card found-item favourite-item' data-label='${label}'>
            <img src='${imageUrl}' class='card-img-top' alt='${label}'>
            <div class='card-body'>
              <h5 class='card-title'>${label}</h5>
              <button type='button' class='btn btn-danger favourite-delete-btn'>
                <i class='fa-solid fa-xmark'></i>
              </button>
              <ul class='list-group list-group-flush'>
                <li class='list-group-item'>
                  ${dishType.map(d => `<span class='badge text-bg-dark d-inline-block mb-1'>${d}</span>`).join('')}
                  ${cuisineType.map(c => `<span class='badge text-bg-success d-inline-block mb-1'>${c}</span>`).join('')}
                </li>
                <li class='list-group-item'>
                  <span class='badge text-bg-secondary'>cooking time: ${totalTime} min</span>
                </li>
                <li class='list-group-item'>
                  <span class='badge text-bg-secondary'>total weight: ${Math.round(totalWeight)} g</span>
                </li>
                <li class='list-group-item'>
                  ${cautions.map(c => `<span class='badge text-bg-danger d-inline-block'>${c}</span>`).join('')}
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
                      ${ingredientLines.map(ing => `<p class='mb-1'>- ${ing}</p>`).join('')}
                    </div>
                  </div>
                </div>
              </div>
              <a href='${url}' class='btn btn-dark recipe-link' target='_blank'>recipe <i class="fa-solid fa-link"></i></a>
            </div>
          </div>
        </div>
      `
    }).join('')

    $container.innerHTML = template
    UI.addFavouriteDeleteListeners()
  }
}

const Handlers = {
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

const Storage = {
  getFavouriteRecipes() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG.favouriteRecipesKey)) || []
    } catch {
      console.warn('Invalid favourite list format.')
      return []
    }
  },

  removeFavouriteRecipe(label) {
    const list = Storage.getFavouriteRecipes()
    const updated = list.filter(item => item.label !== label)
    localStorage.setItem(CONFIG.favouriteRecipesKey, JSON.stringify(updated))
    return updated
  }
}

const UI = {
  addFavouriteDeleteListeners() {
    const $items = $favouriteRecipes.getElementsByClassName('favourite-item')

    Array.from($items).forEach(item => {
      const $deleteBtn = item.querySelector('.favourite-delete-btn')

      $deleteBtn.addEventListener('click', () => {
        const label = item.dataset.label
        const updatedList = Storage.removeFavouriteRecipe(label)

        item.classList.add('animated')
        setTimeout(() => {
          item.parentElement.remove()
          if (!updatedList.length) Render.noFavourites($favouriteRecipes)
        }, 500)
      })
    })
  },

  showToast() {
    const toast = bootstrap.Toast.getOrCreateInstance(document.getElementById('toast'))
    toast.show()
  }
}

const Utils = {
  getCheckedCheckboxValues(containerSelector) {
    return Array.from(document.querySelectorAll(`${containerSelector} input[type="checkbox"]:checked`)).map(input => input.name)
  }
}