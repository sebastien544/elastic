// Set up the Elasticsearch endpoint
const ES_ENDPOINT = 'https://my-deployment-dd304c.es.europe-west1.gcp.cloud.es.io/my_index';

var currentFocus;

// Handle click outside of search results
document.addEventListener('click', ({ target }) => {
  const searchResults = document.getElementById('search-results');
  if (searchResults && !searchResults.contains(target)) {
      searchResults.remove();
  }
});

// Handle search bar input events
const searchBar = document.getElementById('search-bar');
searchBar.addEventListener('input', async () => {
  currentFocus = 0;
  const query = searchBar.value.trim();
  if(query){
    let results = await search(query);
    if(results.length == 0){
      results = await suggest(query);
    }
    if(results.length == 0) {
      document.getElementById('search-results').innerHTML = "Cette situation clinique n'est pas encore disponible"
      return true;
    }
    displayResults(results);
  }else {
    document.querySelector('#search-results')?.remove();
  }
});

window.addEventListener('resize', () => {
  const inputRect = searchBar.getBoundingClientRect();
  const div = document.querySelector('#search-results')
  if(div){
      div.style.width = inputRect.width + "px";
      div.style.left = inputRect.left + "px";
      div.style.top = (inputRect.bottom + 5) + "px";
  }
});

searchBar.addEventListener('focus', async () => {
  const query = searchBar.value.trim();

  if(query){
    const results = await search(query);
    displayResults(results);
  }
});

searchBar.addEventListener("keydown", function(e) {
  var x = document.getElementById("search-results");
  if (x) x = x.getElementsByTagName("a");
  if (e.keyCode == 40) {
    currentFocus++;
    /*and and make the current item more visible:*/
    addActive(x);
  } else if (e.keyCode == 38) { //up
    currentFocus--;
    /*and and make the current item more visible:*/
    addActive(x);
  } else if (e.keyCode == 13) {
    /*If the ENTER key is pressed, prevent the form from being submitted,*/
    e.preventDefault();
    if (currentFocus > -1) {
      /*and simulate a click on the "active" item:*/
      if (x) x[currentFocus].click();
    }
  }
});

function addActive(x) {
  /*a function to classify an item as "active":*/
  if (!x) return false;
  /*start by removing the "active" class on all items:*/
  removeActive(x);
  if (currentFocus >= x.length) currentFocus = 0;
  if (currentFocus < 0) currentFocus = (x.length - 1);
  /*add class "autocomplete-active":*/
  x[currentFocus].classList.add("autocomplete-active");
}

function removeActive(x) {
  /*a function to remove the "active" class from all autocomplete items:*/
  for (var i = 0; i < x.length; i++) {
    x[i].classList.remove("autocomplete-active");
  }
}

// Execute the Elasticsearch search query
async function search(query) {
  try {
    const response = await axios.post('https://my-deployment-9f3681.es.europe-west1.gcp.cloud.es.io/my_index5/_search', {
      query: {
        query_string: {
          query: query+'*',
          fields: [
            "Name^5",
            "Alias^4",
            "Ordonnances médicales^3",
            "Conseils patient^2",
            "Informations cliniques - HTML"
          ]
        }
      },
      size: 5,
      sort: [
        { _score: { order: "desc" } },
        { Alias: { order: "desc", missing: "_last" } },
        { "Ordonnances médicales": { order: "desc", missing: "_last" } },
        { "Conseils patient": { order: "desc", missing: "_last" } }
      ]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'ApiKey MzZzNVJvY0Jpa3NKaVFhc3o2V0k6UzJNbjNQU0ZSVWVTbndmOU9aLUVBZw=='
      }
    });

  return response.data.hits.hits.map(hit => ({
      Name: hit._source.Name,
      Slug: hit._source.Slug
      // url: hit._source.url,
      // img: hit._source.img
  }));
  } catch (error) {
      console.error(error);
  }
}


async function suggest(query) {
  try {
    const response = await axios.post('https://my-deployment-9f3681.es.europe-west1.gcp.cloud.es.io/my_index5/_search', {
      suggest: {
        suggestion: {
          prefix: query,
          completion: {
            field: "Slug",
            fuzzy: {
              fuzziness: "AUTO"
            }
          }
        }
      }
      // size: 5,
      // sort: [
      //   { _score: { order: "desc" } },
      //   { Alias: { order: "desc", missing: "_last" } },
      //   { "Ordonnances médicales": { order: "desc", missing: "_last" } },
      //   { "Conseils patient": { order: "desc", missing: "_last" } }
      // ]
      
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'ApiKey MzZzNVJvY0Jpa3NKaVFhc3o2V0k6UzJNbjNQU0ZSVWVTbndmOU9aLUVBZw=='
      }
    });
  
    return response.data.suggest.suggestion[0].options.map(option => ({
      Name: option._source.Name,
      Slug: option._source.Slug
    }));
  } catch (error) {
      console.error(error);
  }
}


// Display the search results
function displayResults(results) {
  let resultList = document.getElementById('search-results')

  if (!resultList) {
    resultList = document.createElement('div');
    resultList.id = 'search-results';
    document.querySelector('body').appendChild(resultList);
  }
  
  resultList.style.cssText = "box-shadow: 0 0 0 1px rgb(35 38 59 / 10%), 0 6px 16px -4px rgb(35 38 59 / 15%); border-radius: 4px; padding: 8px;background: #fff; position: absolute;";
  resultList.innerHTML = '';

  const inputRect = document.querySelector('form').getBoundingClientRect();
  resultList.style.width = (inputRect.width - 20) + "px";
  console.log(inputRect.left);
  resultList.style.left = inputRect.left + "px";
  resultList.style.top = (inputRect.bottom + 10) + "px";
  resultList.style.zIndex= '9999';
  resultList.style.background = 'white';

  results.forEach((result, index) => {
      const resultElement = document.createElement('a');
      resultElement.classList.add('search-result');
      resultElement.style.cssText = "text-decoration: none; color: #0C0E16; padding: 12px 12px; display: flex;";
      if (index === 0) resultElement.classList.add("autocomplete-active");
      resultElement.href = 'https://www.ordotype.fr/pathologies/'+result.Slug;
      resultElement.onmouseover = function() { this.style.background = 'rgb(240,243,255)'; };
      resultElement.onmouseout = function() { this.style.background = 'none'; };
      resultElement.innerText = result.Name;
      resultList.appendChild(resultElement);
  });
}
