'use strict';


const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #workouts;
  #map;
  #me;

  constructor() {
    this.#workouts = [];
    this.getPosition();

    form.addEventListener("submit", this.saveWorkout.bind(this));

    inputType.addEventListener("change", function() {
      this.toggleElevationField();
    }.bind(this));
  }

  getPosition() {
    navigator.geolocation.getCurrentPosition(this.loadMap.bind(this), (e) => alert("Couldn't get your position for map"));
  }

  loadMap(position) {
    const { latitude, longitude } = position.coords;
    console.log(`https://www.google.it/maps/@${latitude},${longitude}`);
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, 17);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.#map);

    L.marker(coords).addTo(this.#map)
      .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
      .openPopup();
    console.log(this.#me);
    this.newWorkout(coords, true);

    this.#map.on("click", this.showForm.bind(this));
  }

  showForm(mEv) {
    this.#me = mEv;
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  hiddenForm() {
    form.classList.add("hidden");
    inputDistance.focused = false;
  }

  toggleElevationField() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }

  saveWorkout(e) {
    e.preventDefault();

    console.log(this.#me);
    const { lat, lng } = this.#me.latlng;
    const newCoords = [lat, lng];

    if (!this.newWorkout(newCoords)) {
      return;
    }
    this.renderWorkoutMarker(this.workouts.at(-1));
    this.renderWorkout(this.workouts.at(-1));
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = "";

    this.hiddenForm();
  }

  renderWorkoutMarker(wo) {
    L.marker(wo.coords).addTo(this.#map)
      .bindPopup(L.popup({
        maxWidth: 250,
        minWidth: 100,
        autoClose: false,
        className: `${inputType.value.trim()}-popup`
      }))
      .setPopupContent(`${wo.description}`)
      .openPopup()
    this.#map.setView(wo.coords, 17);
  }

  renderWorkout(wo) {
    let html = `
      <li class='workout workout--${wo.type.replace(wo.type[0],wo.type[0].toLowerCase())}' data-id='${wo.id}'>
          <h2 class='workout__title'>${wo.description}</h2>
          <div class='workout__details'>
            <span class='workout__icon'>${typeof wo === "Running" ? "🏃♂" : "🚴🏻‍♀️"}‍️</span>
            <span class='workout__value'>${wo.distance}</span>
            <span class='workout__unit'>km</span>
          </div>
          <div class='workout__details'>
            <span class='workout__icon'>⏱</span>
            <span class='workout__value'>${wo.duration}</span>
            <span class='workout__unit'>min</span>
          </div>
    `;

    if (typeof wo === "Running") {
      html += `
        <div class='workout__details'>
            <span class='workout__icon'>⚡️</span>
            <span class='workout__value'>${wo.calcPace()}</span>
            <span class='workout__unit'>min/km</span>
        </div>
        <div class='workout__details'>
            <span class='workout__icon'>🦶🏼</span>
            <span class='workout__value'>${wo.cadence}</span>
            <span class='workout__unit'>spm</span>
        </div>
    </li>
    `
    }

    if (typeof wo === "Cycling") {
      html += `
           <div class='workout__details'>
              <span class='workout__icon'>⚡️</span>
              <span class='workout__value'>${wo.calcSpeed().toFixed(1)}</span>
              <span class='workout__unit'>km/h</span>
           </div>
           <div class='workout__details'>
              <span class='workout__icon'>⛰</span>
              <span class='workout__value'>${wo.elevationGain}</span>
              <span class='workout__unit'>m</span>
           </div>
        </li>
        `
    }

    form.insertAdjacentHTML("afterend",html);

  }

    newWorkout(newCoords, init){
      let workout;
      let inputT = !init ? inputType.value.trim() : init;

      const checkForm = (!inputDistance.value.trim() || !isFinite(+inputDistance.value)) || (!inputDuration.value.trim() || !isFinite(+inputDuration.value)) || !newCoords.length || (inputType.value.trim() === "running" ? (!inputCadence.value.trim() || !isFinite(+inputCadence.value)) : (!inputElevation.value.trim() || !isFinite(+inputElevation.value)))
      if ((checkForm) && !init) {
        alert("Please, form fields must not be empty");
        return false;
      }

      switch (inputT) {
        case "running":
          workout = new Running(+inputDistance.value, +inputDuration.value, newCoords, "test", +inputCadence.value);
          break;
        case "cycling":
          workout = new Cycling(+inputDistance.value, +inputDuration.value, newCoords, "test", +inputElevation.value);
          break
        default:
          workout = new Workout(+inputDistance.value, +inputDuration.value, newCoords);
          break;
      }

      this.#workouts.push(workout);
      return true;
    }

    get workouts(){
      return this.#workouts.slice();
    }
}

class Workout {
  #id;
  #distance;
  #duration;
  #coords;
  #date;
  #type;

  constructor(distance,duration,coords) {
    this.#id=(new Date()+"").slice(0);
    this.#distance=distance;
    this.#duration=duration;
    this.#coords=coords;
    this.#date=new Date();
    this.#type="workout";
  }

  get id(){
    return this.#id;
  }
  get coords(){
    return this.#coords.slice();
  }
  get duration(){
    return this.#duration;
  }

  get distance(){
    return this.#distance;
  }

  set type(type){
    this.#type=type;
  }

  get type(){
    return this.#type;
  }
  get description(){
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const description=`${this.#type} on ${months[this.#date.getMonth()]} ${this.#date.getDate()}`;
    return description;
  }
}

class Running extends Workout{
  #name;
  #cadence;
  #pace;
  constructor(distance,duration,coords,name,cadence) {
    super(distance,duration,coords);
    super.type="Running"
    this.#name=name;
    this.#cadence=cadence;
    this.calcPace();
  }

  calcPace(){
    this.#pace=this.duration/this.distance;
    return this.#pace;
  }

  get cadence(){
    return this.#cadence;
  }

}

class Cycling extends Workout{
  #name;
  #elevationGain;
  #speed;
  constructor(distance,duration,coords,name,elevationGain) {
    super(distance,duration,coords);
    super.type="Cycling";
    this.#name=name;
    this.#elevationGain=elevationGain;
    this.calcSpeed();
  }

  get elevationGain(){
    return this.#elevationGain;
  }

  calcSpeed(){
    this.#speed=this.distance/(this.duration/60);
    return this.#speed;
  }
}

const app=new App();

// let map,me;
// navigator.geolocation.getCurrentPosition(function(position) {
//   const {latitude,longitude}=position.coords;
//   console.log(latitude,longitude);
//   console.log(`https://www.google.it/maps/@${latitude},${longitude}`);
//   const coords=[latitude,longitude];
//   map = L.map('map').setView(coords, 17);
//   console.log(map);
//   L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//   }).addTo(map);
//
//   L.marker(coords).addTo(map)
//     .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
//     .openPopup();
//
//   map.on("click",function(mEv) {
//     console.log(mEv.latlng);
//     form.classList.remove("hidden");
//     inputDistance.focus();
//     me=mEv;
//   })
// },function(e) {
//   alert("Couldn't get your position for map")
// });
//
// form.addEventListener("submit",function(e) {
//   e.preventDefault();
//   inputDistance.value=inputDuration.value=inputCadence.value=inputElevation.value="";
//   console.log(me);
//   const {lat,lng}=me.latlng;
//   const newCoords=[lat,lng];
//
//   L.marker(newCoords).addTo(map)
//     .bindPopup(L.popup({
//       maxWidth:250,
//       minWidth:100,
//       autoClose:false,
//       className:"running-popup"
//     }))
//     .setPopupContent("workout")
//     .openPopup()
//   map.setView(newCoords,17);
// });
//
// inputType.addEventListener("change",function() {
//   inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
//   inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
// });
