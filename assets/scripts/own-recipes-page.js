let $ownRecipes = undefined
let $creationalForm = undefined

document.addEventListener('DOMContentLoaded', () => {
  $ownRecipes = document.getElementById('own-recipes')
  $creationalForm = document.getElementById('create-recipe-form')

  App.renderOwnRecipes()
  $creationalForm.addEventListener('submit', Handlers.ownCreateSubmitHandler)
})

const App = {
  renderOwnRecipes() {
    const ownList = Storage.getOwnRecipes()
    ownList?.length ? Render.ownRecipes(ownList) : Render.ownRecipes()
  }
}

const Handlers = {
  ownCreateSubmitHandler(event) {
    event.preventDefault()

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

    Storage.addOwnRecipe(recipe)

    const $modal = document.getElementById('create-recipe')
    const modal = bootstrap.Modal.getInstance($modal)
    modal.hide()

    $creationalForm.reset()
    App.renderOwnRecipes()
    UI.showToast()
  }
}

const Render = {
  ownRecipes(ownList = undefined) {
    if (!ownList) {
      $ownRecipes.innerHTML = `<p>You have not created any recipes yet...</p>`
      return
    }

    const template = ownList.map((item, ind) => {
      const {
        label, ingredients, instructions, time, weight,
        diets = [], allergies = [], creationDate
      } = item

      return `
        <div class='col'>
          <div class='card found-item own-item' data-label='${label}'>
            <div class='card-body'>
              <h5 class='card-title text-center'>${label}</h5>
              <button type='button' class='btn btn-danger own-delete-btn mb-2'>
                <i class='fa-solid fa-xmark'></i>
              </button>
              <ul class='list-group list-group-flush'>
                ${diets.length ? `<li class='list-group-item'>${diets.map(diet => `<span class='badge text-bg-primary d-inline-block mb-1'>${diet}</span>`).join('')}</li>` : ''}
                ${allergies.length ? `<li class='list-group-item'>${allergies.map(allergy => `<span class='badge text-bg-success d-inline-block mb-1'>${allergy}</span>`).join('')}</li>` : ''}
                <li class='list-group-item mt-2'>
                  <p class='mb-1 text-decoration-underline'><b>ingredients:</b></p>
                  ${ingredients.split('\n').map(item => `<p class='mb-1'>${item}</p>`).join('')}
                </li>
                <li class='list-group-item mt-2'>
                  <p class='mb-1 text-decoration-underline'><b>instructions:</b></p>
                  ${instructions.split('\n').map(item => `<p class='mb-1'>${item}</p>`).join('')}
                </li>
                ${time ? `<li class='list-group-item'><span class='badge text-bg-secondary'>cooking time: ${time} min</span></li>` : ''}
                ${weight ? `<li class='list-group-item'><span class='badge text-bg-secondary'>total weight: ${Math.round(weight)} g</span></li>` : ''}
                ${creationDate ? `<li class='list-group-item mt-2'><p class='mb-0'>created: ${creationDate}</p></li>` : ''}
              </ul>
            </div>
          </div>
        </div>
      `
    }).join('')

    $ownRecipes.innerHTML = template
    UI.addOwnDeletionListeners()
  }
}

const UI = {
  addOwnDeletionListeners() {
    const $ownItems = $ownRecipes.getElementsByClassName('own-item')

    Array.from($ownItems).forEach(item => {
      const $deleteButton = item.querySelector('.own-delete-btn')

      $deleteButton.addEventListener('click', () => {
        const label = item.dataset.label
        Storage.removeOwnRecipe(label)

        item.classList.add('animated')
        setTimeout(() => {
          item.parentElement.remove()
          if (!Storage.getOwnRecipes().length) {
            Render.ownRecipes()
          }
        }, 500)
      })
    })
  },

  showToast() {
    const toast = bootstrap.Toast.getOrCreateInstance(document.getElementById('toast'))
    toast.show()
  }
}

const Storage = {
  getOwnRecipes() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG.ownRecipesKey)) || []
    } catch {
      console.warn('Invalid own recipes format.')
      return []
    }
  },

  addOwnRecipe(recipe) {
    const recipes = this.getOwnRecipes()
    recipes.push(recipe)
    localStorage.setItem(CONFIG.ownRecipesKey, JSON.stringify(recipes))
  },

  removeOwnRecipe(label) {
    let recipes = this.getOwnRecipes()
    recipes = recipes.filter(r => r.label !== label)
    localStorage.setItem(CONFIG.ownRecipesKey, JSON.stringify(recipes))
  }
}

const Utils = {
  getCheckedCheckboxValues(containerSelector) {
    return Array.from(document.querySelectorAll(`${containerSelector} input[type="checkbox"]:checked`)).map(input => input.name)
  }
}