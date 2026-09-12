/* =========================================================
   SUSAMPAD CUSTOMER DELIVERY CHECK
   =========================================================
 *
 * This file handles:
 *
 * - Map
 * - Strawberry customer marker
 * - Dragging marker
 * - Current location
 * - Searching location
 * - Loading delivery areas from JSON
 * - Automatically refreshing delivery areas
 * - Checking whether customer is inside delivery area
 * - Showing delivery result
 *
 * Delivery areas are loaded from:
 *
 * data/delivery-areas.json
 *
 * Expected JSON:
 *
 * {
 *   "areas": [
 *     [
 *       {
 *         "lat": 17.35,
 *         "lng": 78.39
 *       }
 *     ]
 *   ]
 * }
 *
 * ========================================================= */


/* =========================================================
   DEFAULT MAP LOCATION
   ========================================================= */

const DEFAULT_LAT = 17.3850;

const DEFAULT_LNG = 78.4867;


/* =========================================================
   DELIVERY AREA FILE
   ========================================================= */

const DELIVERY_AREAS_FILE =
    "data/delivery-areas.json";


/* =========================================================
   DELIVERY AREA AUTO REFRESH
   =========================================================
 *
 * The customer page checks the JSON file every 10 seconds.
 *
 * This means when you update delivery-areas.json on GitHub,
 * the customer page can automatically detect the change
 * without requiring Ctrl + F5.
 *
 * ========================================================= */

const DELIVERY_AREA_REFRESH_INTERVAL =
    10000;


/* =========================================================
   MAP
   ========================================================= */

const map =
    L.map("map", {

        scrollWheelZoom: false

    }).setView(

        [
            DEFAULT_LAT,
            DEFAULT_LNG
        ],

        12

    );


/* =========================================================
   MAP TILES
   ========================================================= */

L.tileLayer(

    "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",

    {

        attribution:
            "&copy; OpenStreetMap contributors &copy; CARTO",

        maxZoom: 19

    }

).addTo(map);


/* =========================================================
   STRAWBERRY MARKER
   ========================================================= */

const strawberryIcon =
    L.divIcon({

        className: "",

        html: `
            <div class="susampad-marker">

                <span class="ring"></span>

                <span class="ring"></span>

                <span class="ring"></span>

                <span class="core">🍓</span>

            </div>
        `,

        iconSize: [1, 1],

        iconAnchor: [0, 0]

    });


/* =========================================================
   CUSTOMER MARKER
   ========================================================= */

const customerMarker =
    L.marker(

        [
            DEFAULT_LAT,
            DEFAULT_LNG
        ],

        {

            draggable: true,

            icon: strawberryIcon

        }

    ).addTo(map);


/* =========================================================
   DRAG MARKER
   ========================================================= */

customerMarker.on(

    "dragend",

    function () {

        const position =
            customerMarker.getLatLng();

        checkDelivery(

            position.lat,

            position.lng

        );

    }

);


/* =========================================================
   DELIVERY AREA CACHE
   ========================================================= */

let deliveryAreas = null;


/* =========================================================
   DELIVERY AREA VERSION
   =========================================================
 *
 * We keep a simple JSON signature so that we can detect
 * whether the downloaded delivery areas are different
 * from the currently displayed areas.
 *
 * ========================================================= */

let deliveryAreasSignature = null;


/* =========================================================
   LOAD DELIVERY AREAS
   ========================================================= */

async function getDeliveryAreas() {

    if (deliveryAreas !== null) {

        return deliveryAreas;

    }


    try {

        const response =
            await fetch(

                DELIVERY_AREAS_FILE +
                "?t=" +
                Date.now(),

                {

                    cache: "no-store"

                }

            );


        if (!response.ok) {

            throw new Error(
                "Unable to load delivery areas."
            );

        }


        const data =
            await response.json();


        if (

            !data ||

            !Array.isArray(data.areas)

        ) {

            console.error(
                "Invalid delivery area JSON."
            );

            deliveryAreas = [];

            deliveryAreasSignature =
                "[]";

            return deliveryAreas;

        }


        deliveryAreas =
            data.areas;


        deliveryAreasSignature =
            JSON.stringify(
                deliveryAreas
            );


        console.log(
            "Delivery areas loaded:",
            deliveryAreas
        );


        return deliveryAreas;

    }

    catch (error) {

        console.error(

            "Unable to load delivery areas:",

            error

        );

        deliveryAreas = [];

        deliveryAreasSignature =
            "[]";

        return deliveryAreas;

    }

}


/* =========================================================
   DRAW DELIVERY AREAS
   ========================================================= */

const deliveryPolygonLayers = [];


async function drawDeliveryAreas() {

    const areas =
        await getDeliveryAreas();


    deliveryPolygonLayers.forEach(

        function (layer) {

            map.removeLayer(layer);

        }

    );


    deliveryPolygonLayers.length = 0;


    areas.forEach(

        function (area) {

            if (

                !Array.isArray(area) ||

                area.length < 3

            ) {

                return;

            }


            const validPoints =
                area

                    .filter(

                        function (point) {

                            return (

                                point &&

                                typeof point.lat === "number" &&

                                typeof point.lng === "number"

                            );

                        }

                    )

                    .map(

                        function (point) {

                            return [

                                point.lat,

                                point.lng

                            ];

                        }

                    );


            if (

                validPoints.length < 3

            ) {

                return;

            }


            const polygon =
                L.polygon(

                    validPoints,

                    {

                        color: "#63b23f",

                        weight: 3,

                        opacity: 1,

                        fillColor: "#63b23f",

                        fillOpacity: 0.16

                    }

                ).addTo(map);


            deliveryPolygonLayers.push(

                polygon

            );

        }

    );


    /*
     * Do NOT automatically move the map to
     * the polygon boundaries.
     *
     * The map remains around Hyderabad.
     */

}


/* =========================================================
   INITIALIZE DELIVERY AREAS
   ========================================================= */

drawDeliveryAreas();


/* =========================================================
   AUTOMATICALLY REFRESH DELIVERY AREAS
   =========================================================
 *
 * This checks GitHub's delivery-areas.json every 10 seconds.
 *
 * IMPORTANT:
 *
 * We do NOT reload the whole webpage.
 *
 * We only:
 *
 * 1. Download the latest JSON.
 * 2. Compare it with the currently loaded JSON.
 * 3. Redraw polygons only when something changed.
 *
 * The strawberry marker and current map position remain
 * untouched.
 *
 * ========================================================= */

async function refreshDeliveryAreas() {

    try {

        const response =
            await fetch(

                DELIVERY_AREAS_FILE +
                "?t=" +
                Date.now(),

                {

                    cache: "no-store"

                }

            );


        if (!response.ok) {

            throw new Error(
                "Unable to refresh delivery areas."
            );

        }


        const data =
            await response.json();


        if (

            !data ||

            !Array.isArray(data.areas)

        ) {

            console.error(
                "Invalid delivery area JSON during refresh."
            );

            return;

        }


        const newSignature =
            JSON.stringify(
                data.areas
            );


        /*
         * Nothing changed.
         *
         * Do not redraw the polygons.
         */

        if (

            newSignature ===
            deliveryAreasSignature

        ) {

            return;

        }


        /*
         * Delivery areas have changed.
         */

        console.log(
            "Delivery areas changed. Updating map..."
        );


        deliveryAreas =
            data.areas;


        deliveryAreasSignature =
            newSignature;


        /*
         * Remove old polygons.
         */

        deliveryPolygonLayers.forEach(

            function (layer) {

                map.removeLayer(layer);

            }

        );


        deliveryPolygonLayers.length = 0;


        /*
         * Draw new polygons.
         */

        deliveryAreas.forEach(

            function (area) {

                if (

                    !Array.isArray(area) ||

                    area.length < 3

                ) {

                    return;

                }


                const validPoints =
                    area

                        .filter(

                            function (point) {

                                return (

                                    point &&

                                    typeof point.lat === "number" &&

                                    typeof point.lng === "number"

                                );

                            }

                        )

                        .map(

                            function (point) {

                                return [

                                    point.lat,

                                    point.lng

                                ];

                            }

                        );


                if (

                    validPoints.length < 3

                ) {

                    return;

                }


                const polygon =
                    L.polygon(

                        validPoints,

                        {

                            color: "#63b23f",

                            weight: 3,

                            opacity: 1,

                            fillColor: "#63b23f",

                            fillOpacity: 0.16

                        }

                    ).addTo(map);


                deliveryPolygonLayers.push(

                    polygon

                );

            }

        );


        console.log(
            "Delivery areas updated successfully."
        );

    }

    catch (error) {

        console.error(

            "Unable to refresh delivery areas:",

            error

        );

    }

}


/* =========================================================
   START DELIVERY AREA AUTO REFRESH
   ========================================================= */

setInterval(

    refreshDeliveryAreas,

    DELIVERY_AREA_REFRESH_INTERVAL

);


/* =========================================================
   POINT INSIDE POLYGON
   ========================================================= */

function pointInsidePolygon(

    lat,

    lng,

    polygon

) {

    let inside = false;


    for (

        let i = 0,

            j = polygon.length - 1;

        i < polygon.length;

        j = i++

    ) {

        const xi =
            polygon[i].lng;

        const yi =
            polygon[i].lat;

        const xj =
            polygon[j].lng;

        const yj =
            polygon[j].lat;


        const intersect =

            (

                (yi > lat) !==

                (yj > lat)

            )

            &&

            (

                lng <

                (

                    ((xj - xi) *

                        (lat - yi) /

                        (yj - yi))

                    + xi

                )

            );


        if (intersect) {

            inside = !inside;

        }

    }


    return inside;

}


/* =========================================================
   CHECK WHETHER LOCATION IS INSIDE ANY AREA
   ========================================================= */

function isInsideDeliveryArea(

    lat,

    lng,

    areas

) {

    for (

        const area of areas

    ) {

        if (

            !Array.isArray(area) ||

            area.length < 3

        ) {

            continue;

        }


        const validPoints =
            area.filter(

                function (point) {

                    return (

                        point &&

                        typeof point.lat === "number" &&

                        typeof point.lng === "number"

                    );

                }

            );


        if (

            validPoints.length < 3

        ) {

            continue;

        }


        if (

            pointInsidePolygon(

                lat,

                lng,

                validPoints

            )

        ) {

            return true;

        }

    }


    return false;

}


/* =========================================================
   RESULT ELEMENTS
   ========================================================= */

const resultSection =
    document.getElementById("result");


const resultCard =
    document.getElementById("resultCard");


const resultIcon =
    document.getElementById("resultIcon");


const resultTitle =
    document.getElementById("resultTitle");


const resultMessage =
    document.getElementById("resultMessage");


const requestServiceButton =
    document.getElementById(
        "requestServiceButton"
    );


const deliverHereButton =
    document.getElementById(
        "deliverHereButton"
    );


/* =========================================================
   SHOW RESULT
   ========================================================= */

function showResult(

    kind,

    icon,

    title,

    message

) {

    /*
     * Make sure the result card uses the
     * exact classes expected by index.html CSS.
     */

    resultCard.className =
        "result-card " + kind;


    resultIcon.textContent =
        icon;


    resultTitle.textContent =
        title;


    resultMessage.textContent =
        message;


    /*
     * Hide both action buttons first.
     */

    requestServiceButton.style.display =
        "none";


    deliverHereButton.style.display =
        "none";


    /*
     * Show result card.
     */

    resultSection.classList.remove(
        "hidden"
    );


    /*
     * Restart animation.
     */

    resultSection.classList.remove(
        "show"
    );


    void resultSection.offsetWidth;


    resultSection.classList.add(
        "show"
    );

}


/* =========================================================
   CHECK DELIVERY
   ========================================================= */

async function checkDelivery(

    lat,

    lng

) {

    /*
     * Show a temporary checking message.
     */

    showResult(

        "pending",

        "…",

        "Checking your location…",

        "Please wait while we check whether Susampad delivers here."

    );


    const areas =
        await getDeliveryAreas();


    /*
     * No delivery areas configured.
     */

    if (

        !areas ||

        areas.length === 0

    ) {

        showResult(

            "pending",

            "?",

            "Delivery area not configured",

            "Our delivery areas have not been configured yet. Please check again later."

        );

        return;

    }


    /*
     * Check location.
     */

    const inside =
        isInsideDeliveryArea(

            lat,

            lng,

            areas

        );


    /* -------------------------------------------------------
       INSIDE DELIVERY AREA
       ------------------------------------------------------- */

    if (inside) {

        showResult(

            "yes",

            "✓",

            "We deliver here!",

            "Yay! Your location is part of the Susampad fresh-bowl family, and our fresh bowls can make their way to your doorstep. 🍓"

        );


        deliverHereButton.style.display =
            "inline-flex";


        return;

    }


    /* -------------------------------------------------------
       OUTSIDE DELIVERY AREA
       ------------------------------------------------------- */

    showResult(

        "no",

        "✕",

        "We don't deliver here yet",

        "Looks like our fresh bowls haven’t reached your neighbourhood just yet. We are growing fast, so check back soon!"

    );


    requestServiceButton.style.display =
        "inline-flex";

}


/* =========================================================
   MOVE CUSTOMER MARKER
   ========================================================= */

function moveCustomerMarker(

    lat,

    lng

) {

    customerMarker.setLatLng(

        [
            lat,

            lng

        ]

    );


    map.flyTo(

        [
            lat,

            lng

        ],

        15,

        {

            duration: 0.9

        }

    );


    checkDelivery(

        lat,

        lng

    );

}


/* =========================================================
   SEARCH ELEMENTS
   ========================================================= */

const locationSearch =
    document.getElementById(
        "locationSearch"
    );


const searchButton =
    document.getElementById(
        "searchButton"
    );


/* =========================================================
   SEARCH LOCATION
   ========================================================= */

async function searchLocation() {

    const query =
        locationSearch.value.trim();


    if (!query) {

        showResult(

            "pending",

            "?",

            "Enter a location",

            "Please enter your area, neighbourhood, landmark, or location."

        );

        return;

    }


    try {

        searchButton.disabled =
            true;


        searchButton.textContent =
            "Searching…";


        const url =

            "https://nominatim.openstreetmap.org/search" +

            "?format=json" +

            "&limit=1" +

            "&q=" +

            encodeURIComponent(

                query + ", Hyderabad, India"

            );


        const response =
            await fetch(

                url,

                {

                    headers: {

                        "Accept":
                            "application/json"

                    }

                }

            );


        if (!response.ok) {

            throw new Error(
                "Location search failed."
            );

        }


        const results =
            await response.json();


        if (

            !results ||

            results.length === 0

        ) {

            showResult(

                "pending",

                "?",

                "Location not found",

                "Try adding a landmark, colony, area, or city name and search again."

            );

            return;

        }


        const lat =
            parseFloat(

                results[0].lat

            );


        const lng =
            parseFloat(

                results[0].lon

            );


        moveCustomerMarker(

            lat,

            lng

        );

    }

    catch (error) {

        console.error(

            "Search error:",

            error

        );


        showResult(

            "pending",

            "!",

            "Something went wrong",

            "We couldn't reach the location service. Please check your connection and try again."

        );

    }

    finally {

        searchButton.disabled =
            false;


        searchButton.textContent =
            "🔍 Search";

    }

}


/* =========================================================
   SEARCH BUTTON
   ========================================================= */

searchButton.addEventListener(

    "click",

    searchLocation

);


/* =========================================================
   ENTER KEY SEARCH
   ========================================================= */

locationSearch.addEventListener(

    "keydown",

    function (event) {

        if (

            event.key === "Enter"

        ) {

            searchLocation();

        }

    }

);


/* =========================================================
   CURRENT LOCATION BUTTON
   ========================================================= */

const useLocationButton =
    document.getElementById(
        "useLocationButton"
    );


useLocationButton.addEventListener(

    "click",

    function () {

        if (

            !navigator.geolocation

        ) {

            showResult(

                "pending",

                "!",

                "Location not supported",

                "Your browser doesn't support automatic location. Please search for your area instead."

            );

            return;

        }


        useLocationButton.disabled =
            true;


        const originalLabel =
            useLocationButton.innerHTML;


        useLocationButton.innerHTML =
            "Locating…";


        navigator.geolocation.getCurrentPosition(

            function (position) {

                const lat =
                    position.coords.latitude;


                const lng =
                    position.coords.longitude;


                moveCustomerMarker(

                    lat,

                    lng

                );


                useLocationButton.disabled =
                    false;


                useLocationButton.innerHTML =
                    originalLabel;

            },


            function (error) {

                console.error(

                    "Location error:",

                    error

                );


                showResult(

                    "pending",

                    "!",

                    "Couldn't get your location",

                    "Please allow location access, or search for your area above instead."

                );


                useLocationButton.disabled =
                    false;


                useLocationButton.innerHTML =
                    originalLabel;

            },


            {

                enableHighAccuracy: true,

                timeout: 10000,

                maximumAge: 0

            }

        );

    }

);


/* =========================================================
   INITIAL MAP RESIZE
   ========================================================= */

window.addEventListener(

    "load",

    function () {

        setTimeout(

            function () {

                map.invalidateSize();

            },

            300

        );

    }

);


/* =========================================================
   WINDOW RESIZE
   ========================================================= */

window.addEventListener(

    "resize",

    function () {

        setTimeout(

            function () {

                map.invalidateSize();

            },

            100

        );

    }

);


/* =========================================================
   IMPORTANT:
   DO NOT SHOW "DELIVERY AREA NOT CONFIGURED"
   ON PAGE LOAD.
   =========================================================
 *
 * The customer should first see the map and strawberry pin.
 *
 * The delivery result appears when:
 *
 * - User searches
 * - User uses current location
 * - User drags the strawberry pin
 *
 * ========================================================= */
