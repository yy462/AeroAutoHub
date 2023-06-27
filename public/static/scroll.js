let page = 1;
let isLoading = false;

// let container = document.querySelector("#car-container");

// function addCarCard(car) {
//     let div = document.createElement("div");
//     div.innerHTML = template
//         .replace("${car.imgurl}", car.imgurl)
//         .replace("${car.brand}", car.brand)
//         .replace("${car.version}", car.version)
//         .replace("${car.year}", car.year)
//         .replace("${car.price}", car.price)
//         .replace("${car.mile}", car.mile)
//         .replace("${car.GPS}", car.GPS ? "Yes" : "No")
//         .replace("${car.seats}", car.seats)
//     container.appendChild(div);
// }


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
            <h2 style="font-family: CarMaxSharpSansDisp-Bold, Frutiger, 'Frutiger Linotype', Univers, Calibri, 'Gill Sans', 'Gill Sans MT', 'Myriad Pro', Myriad, 'DejaVu Sans Condensed', 'Liberation Sans', 'Nimbus Sans L', Tahoma, Geneva, 'Helvetica Neue', Helvetica, Arial, sans-serif; font-style: normal; font-weight: 700; font-size: 1.5rem; line-height: 1.5; letter-spacing: .62px; color: #053361; margin: 0.375rem 0;">
                ${car.brand + " " + car.version + " " + car.year}
            </h2>
            <p class="card-text" style="display: flex; flex-wrap: wrap; word-break: break-word; margin: 0 0 0.375rem; font-family: CarMaxSharpSansDisp-Bold, Frutiger, 'Frutiger Linotype', Univers, Calibri, 'Gill Sans', 'Gill Sans MT', 'Myriad Pro', Myriad, 'DejaVu Sans Condensed', 'Liberation Sans', 'Nimbus Sans L', Tahoma, Geneva, 'Helvetica Neue', Helvetica, Arial, sans-serif; font-style: normal; font-weight: 700; font-size: 1.0rem; line-height: 1.5; letter-spacing: .38px; color: #2a343d;">
                
                ${"Price: " + "$" + Math.floor(car.price * 10000 / 6.9).toLocaleString()}
                <br/>
                ${"Miles: " + String(car.mile.toLocaleString()) * 10 + "K mi"}
                <br/>
                ${"GPS: " + (car.GPS ? "Yes" : "no")}
                <br/>
                ${"Seats: " + car.seats}
            </p>
            <div class="d-flex justify-content-between align-items-center">
                <div class="btn-group">
                    <button type="button" class="btn btn-sm btn-outline-secondary border-2" onclick="location.href='/cars/${car._id}'">View</button>
            </div>
          </div>
          
        </div>
    </div>`;
    div.innerHTML = template
    return div;
}

// for (let car of initialCars) {
//     addCarCard(car);
// }


(function () {
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

    window.onload = function () {
        console.log("window is loading");
        const container = document.querySelector(".row-cols-md-3");
        for (let car of initialCars) {
            const carCard = createCarCard(car);
            container.appendChild(carCard);
        }
    }
})();

