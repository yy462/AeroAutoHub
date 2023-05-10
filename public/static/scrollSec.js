let page = 1;
let isLoading = false;

let user = initialUser;
// console.log("innitial user is ", user);

function createCarCard(car) {
    const div = document.createElement("div");
    div.classList.add("col");
    let template = `
    <div class="card shadow">
        <div class="card-img-container" style="height: 225px; overflow: hidden; position: relative;">
            <img 
                id="car_img" 
                src="${car.imgurl}" 
                alt="Car image" 
                style="width: 100%; height: auto; min-height: 100%; position: absolute; top: 50%; transform: translateY(-50%);" 
            />
        </div>

        <div class="card-body">
            <h2>${car.brand + " " + car.version + " " + car.year}</h2>
            <p class="card-text">
                ${"price:" + String(car.price)}
                <br/>
                ${"Miles: " + String(car.mile)}
                <br/>
                ${"GPS: " + (car.GPS? "Yes":"no")}
                <br/>
                ${"Seats: " + car.seats}
            </p>
            <div class="d-flex justify-content-between align-items-center">
                <div class="btn-group">
                    <button type="button" class="btn btn-sm btn-outline-secondary" onclick="location.href='/cars/${user._id}/${car._id}'">View</button>
                </div>
            </div>
        </div>
    </div>`;
    div.innerHTML = template
    return div;
}


(function() {
    window.onscroll = async function () {
        //if is loading or not reaching the end, then return
        console.log("window is scrolling");
        if (isLoading || window.innerHeight + window.scrollY < document.body.offsetHeight - 100) {
            // console.log("is scrolling");
            return; 
        }
    
        isLoading = true;
        
    
        const response = await fetch(`/getMoreCars?page=${page}`);
        const cars = await response.json();
    
        const container = document.querySelector(".row-cols-md-3");
        for (let car of cars) {
            const carCard = createCarCard(car);
            container.appendChild(carCard);
            // const div = document.createElement("div");
            // div.innerHTML = template;
            // container.appendChild(div);
        }
        page++;
        isLoading = false;
    }
    
    window.onload = function() {
        console.log("window is loading");
        const container = document.querySelector(".row-cols-md-3");
        for (let car of initialCars) {
            const carCard = createCarCard(car);
            container.appendChild(carCard);
        }
    }
})();

