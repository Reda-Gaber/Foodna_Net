const test = fetch("http://localhost:5001/api/products")
.then(data => {
  console.log(data.json())
})
.catch(err => {
  console.error(err)
})


async function apiass () {
 try {
    let myRequest = await fetch("./json/min.json");
    let dataRequest = await myRequest.json();      
     resion(dataRequest);
     cteBere (dataRequest);
     brent(dataRequest);
    brentads (dataRequest);
    let mork = dataRequest.products;
    console.log(mork);
    nam(mork);

 } catch (error){
       console.error("glp al bunat");
    }
}
function nam (prm) {
  const bler = prm.filter(function (a) {
         if (a.test === "pz") {
           return a;
         }
         });
           
}

apiass();
const mySwiper = document.querySelector(".slides_matc");
function resion (actev) {
 for (let i = 0; i < 4; i++) {   
 const createDiv = document.createElement("div");
 createDiv.classList.add("swiper-slide") 
 createDiv.innerHTML = `<img src=${actev.slider[i].imgs} alt="Slide 1">`;
 mySwiper.appendChild(createDiv);
 }
}

const OffersSlide = document.querySelector(".Offers_slide");
function  cteBere (data) {
for (let i = 0; i < 3; i++) {
 const createEle = document.createElement("div");
 createEle.classList.add("swiper-slide");
 createEle.classList.add("slide");
 createEle.innerHTML = `<img src="${data.Offers[i].imgs_1}" alt="Image 1">
        <img src="${data.Offers[i].imgs_2}" alt="Image 2">`;
   OffersSlide.appendChild(createEle); 
}
}


const productsGrid = document.querySelector(".products-grid_1");
function brent (after) {
  const sllit = after.products;
  const bler = sllit.filter(function (a) {
         if (a.test === "pz") {
           return a;
         }
         });
for (let i = 0; i < 6; i++) {

 const createElz = document.createElement("div");
 createElz.classList.add("product");
 createElz.classList.add("swiper-slide");
 createElz.innerHTML = `<img src="${bler[i].img}" alt="Pizza 1">
  <div class="product-info">
        <h3>${bler[i].title}</h3>
        <div class="points">${bler[i].points} Points</div>
        <div class="price">${bler[i].price} EGP</div>
   </div>
    <div class="featured__actions">          
        <button class=""> <a href="/product-page?id=${bler[i].id}">select options</a></button>     
    </div>`;
productsGrid.appendChild(createElz);
}
}
// data-id="${after.products[i].id}"

const productsGrids = document.querySelector(".products-grid_2");
function brentads (befor) {
  const slli = befor.products;
  const ble = slli.filter(function (a) {
         if (a.test === "ch") {
           return a;
         }
         });
for (let i = 0; i < 6; i++) {
 const createElp = document.createElement("div");
 createElp.classList.add("product");
 createElp.classList.add("swiper-slide");
 createElp.classList.add("home__article");
 createElp.innerHTML = `<img src="${ble[i].img}" alt="Pizza 1">
      <div class="product-info">
        <h3>${ble[i].title}</h3>
        <div class="points">${ble[i].points} Points</div>
        <div class="price">${ble[i].price} EGP</div>
      </div>
      <div class="featured__actions">
                    
    <button class=""> <a href="/product-page?id=${ble[i].id}">select options</a></button> 
   </div>`;
productsGrids.appendChild(createElp);
}
}