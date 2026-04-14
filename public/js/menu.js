async function apiass () {
 try {
    let myRequest = await fetch("../json/min.json");
    let dataRequest = await myRequest.json();
     brent(dataRequest);
 } catch (error){
       console.error("glp al bunat");
    }
}
apiass();

const productsGrid = document.querySelector(".products-grid_1");
function brent (after) {
    let dfdx = after.products;
    dfdx.forEach(a => {
       const createElz = document.createElement("div");
 createElz.classList.add("product");
 createElz.innerHTML = `<img src="../${a.img}" alt="Pizza 1">
  <div class="product-info">
        <h3>${a.title}</h3>
        <div class="points">${a.points} Points</div>
        <div class="price">${a.price} EGP</div>
   </div>
    <div class="featured__actions">          
        <button class="mjx"> <a href="Product-page.html?id=${a.id}">select options</a></button>     
    </div>`;
productsGrid.appendChild(createElz);
    });

const Offers = document.getElementById("Offers");
Offers.addEventListener('click', () => {
    productsGrid.innerHTML = "";
    productsGrid.classList.add("offers_only")
   after.Offers.forEach(a => {
       const createEl = document.createElement("div");
 createEl.classList.add("product");
 createEl.classList.add("product_only");

 createEl.innerHTML = `<img class="Offe" src="../${a.imgs_1}" alt="Pizza 1">
  <div class="product-info">
   </div>
    <div class="featured__actions">          
        <button class="mjx"> <a href="Product-page.html?id=${a.id}">select options</a></button>     
    </div>`;
 productsGrid.appendChild(createEl);
    });    
});
}