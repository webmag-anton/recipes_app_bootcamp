const appID = '3084784d'
const appKey = 'dc83d53eaf6e9bcde3a249be9b9d6ce7'

let $searchFilter = undefined
let $main = undefined
let currentFoundRecipes = []

document.addEventListener('DOMContentLoaded', () => {
  $searchFilter = document.getElementById('search-filter')
  $main = document.getElementById('main')

  if (sessionStorage.getItem('favouriteRecipes')) {
    render(JSON.parse(sessionStorage.getItem('favouriteRecipes')))
  }

  $searchFilter.addEventListener('submit', async function(event) {
    event.preventDefault()

    const url = new URL(`https://api.edamam.com/api/recipes/v2?`)
    let params = new URLSearchParams(url.search)
    params.append('type', 'public')
    params.append('app_id', appID)
    params.append('app_key', appKey)

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
    render(fetchedRecipes)

    sessionStorage.setItem('favouriteRecipes', JSON.stringify(fetchedRecipes))
  })
})


async function fetchData(url) {
  try {
    let response = await fetch(url)
    if (response.ok) {
      let json = await response.json()
      console.log(json)
      return json
    } else {
      console.error(`http error: status ${response.status}`)
    }
  }
  catch(err) {
    console.error(`request error`)
  }
}

function render(fetchedRecipes) {
  let template = ''
  const {hits: recipes = []} = fetchedRecipes

  const favouriteList = JSON.parse(localStorage.getItem('favouriteRecipes'))

  recipes.forEach((item, ind) => {
    const {recipe: {
      label = '',
      images: { REGULAR: { url: imageUrl = '' } = {} } = {},
      cuisineType = [],
      dishType = [],
      cautions = [],
      ingredientLines = [],
      totalTime = '',
      totalWeight = ''
    } = {}} = item

    currentFoundRecipes.push({label, imageUrl})

    template += `      
      <div class='col'>
        <div class='card found-item' data-label='${label}'>
          <img src='${imageUrl}' class='card-img-top' alt='${label}'>
          <div class='card-body'>
            <h5 class='card-title'>${label}</h5>
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
            
            <div class='accordion mb-3' id='accordion_${ind}'>
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
            
            <button type='button' class='btn btn-warning btn-favourite'>
              <i class='${favouriteList?.findIndex(item => item.label === label) > -1 ? 'fa-solid' : 'fa-regular'} fa-star'></i>
            </button>
          </div>
        </div>
      </div>
    `
  })
  document.getElementById('found-recipes').innerHTML = template

//   addCardClickListener()
}

