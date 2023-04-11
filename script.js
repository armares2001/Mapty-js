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
    this.#map=L.map('map');
    (async ()=>{
      await this.getPosition();

      form.addEventListener("submit", this.saveWorkout.bind(this));

      inputType.addEventListener("change",this.toggleElevationField);
      containerWorkouts.addEventListener("click",this.moveToPopup.bind(this));

      this.getLocaleStorage();
    })();

  }

  getPosition() {
    navigator.geolocation.getCurrentPosition(this.loadMap.bind(this), (e) => alert("Couldn't get your position for map"));
  }

  loadMap(position) {
    const { latitude, longitude } = position.coords;
    console.log(`https://www.google.it/maps/@${latitude},${longitude}`);
    const coords = [latitude, longitude];
    this.#map = this.#map.setView(coords, 17);
    console.log();

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.#map);

    L.marker(coords).addTo(this.#map)
      .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
      .openPopup();
    console.log(this.#me);

    this.#map.on("click", this.showForm.bind(this));
  }

  moveToPopup(e){
    const woEl=e.target.closest(".workout");
    if (!woEl) return;

    const wo=this.#workouts.find(woObj=>woObj.id===woEl.dataset.id);
    console.log(wo);
    this.#map.setView(wo.coords, 17,{
      animate:true,
      pan:{
        duration:1
      }
    });
    wo.click();
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

    this.setLocaleStorage();
    console.log(JSON.parse(localStorage.getItem("workouts")));
    console.log(this.#workouts);
  }

  setLocaleStorage(){
    console.log(this.workouts);
    localStorage.setItem("workouts",JSON.stringify(this.workouts));
  }

  getLocaleStorage(){
    const workouts=JSON.parse(localStorage.getItem("workouts"));
    if (!workouts) return;
    const wosClasses=[];
    workouts.forEach(wo=>{
      let woClass;
      if (wo.type==="Running"){
        woClass=new Running();
      }
      if (wo.type==="Cycling"){
        woClass=new Cycling();
      }
      Object.assign(woClass, wo);
      console.log("WoClass",woClass);
      wosClasses.push(woClass);
    })
    this.#workouts=wosClasses;
    this.#workouts.forEach(wo=>{
        this.renderWorkoutMarker(wo);
        this.renderWorkout(wo);
    });
  }

  renderWorkoutMarker(wo) {
    console.log(this.#map);
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
    console.log(typeof wo);
    if ( wo.type === "Running") {
      html += `
        <div class='workout__details'>
            <span class='workout__icon'>⚡️</span>
            <span class='workout__value'>${wo.pace}</span>
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

    if (wo.type === "Cycling") {
      html += `
           <div class='workout__details'>
              <span class='workout__icon'>⚡️</span>
              <span class='workout__value'>${wo.speed.toFixed(1)}</span>
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
          console.log("ciao");
          workout = new Workout(+inputDistance.value, +inputDuration.value, newCoords);
          break;
      }

      this.#workouts.push(workout);
      return true;
    }

    get workouts(){
      return this.#workouts.slice();
    }

    reset(){
      localStorage.removeItem("workouts");
      location.reload();
    }
}

class Workout {

  constructor(distance,duration,coords) {
    this.id=(new Date()+"").slice(0);
    this.distance=distance;
    this.duration=duration;
    this.coords=coords;
    this.date=new Date();
    this.type="workout";
    this.clicks=0;
    this.description=this.getDescription();
  }

  click(){
    this.clicks++;
  }
  getDescription(){
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const description=`${this.type} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    return description;
  }
}

class Running extends Workout{

  constructor(distance,duration,coords,name,cadence) {
    super(distance,duration,coords);
    super.type="Running"
    this.name=name;
    this.cadence=cadence;
    super.description=super.getDescription();
    this.calcPace();
  }

  calcPace(){
    this.pace=this.duration/this.distance;
    return this.pace;
  }

}

class Cycling extends Workout{

  constructor(distance,duration,coords,name,elevationGain) {
    super(distance,duration,coords);
    super.type="Cycling";
    this.name=name;
    this.elevationGain=elevationGain;
    super.description=super.getDescription();
    this.calcSpeed();
  }

  calcSpeed(){
    this.speed=this.distance/(this.duration/60);
    return this.speed;
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
