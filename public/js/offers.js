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
}