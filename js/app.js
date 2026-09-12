
/* =========================================================
   CUSTOMER DELIVERY CHECK
   =========================================================
 *
 * This file handles:
 *
 * - Map
 * - Customer marker
 * - Dragging marker
 * - Current location
 * - Searching location
 * - Loading delivery areas
 * - Checking whether customer is inside delivery area
 *
 * ========================================================= */


/* =========================================================
   HYDERABAD DEFAULT LOCATION
   ========================================================= */

const DEFAULT_LAT = 17.3850;

const DEFAULT_LNG = 78.4867;


/* =========================================================
   DELIVERY AREA JSON FILE
   ========================================================= */

const DELIVERY_AREAS_FILE =
    "data/delivery-areas.json";


/* =========================================================
   MAP
   ========================================================= */

const map =
    L.map("map").setView(
        [
            DEFAULT_LAT,
            DEFAULT_LNG
        ],
        11
    );


/* =========================================================
   FREE MAP TILES
   =========================================================
 *
 * Uses OpenStreetMap France tiles.
 *
 * No API key is required.
 *
 * ========================================================= */

L.tileLayer(
    "https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png",
    {
        maxZoom: 20,

        attribution:
            "&copy; OpenStreetMap contributors"
    }
).addTo(map);


/* =========================================================
   PROFESSIONAL FRUIT BOWL PIN
   =========================================================
 *
 * Large green delivery pin with a small fruit-bowl
 * icon in the center.
 *
 * The pin keeps the same visual size when the
 * customer zooms the map.
 *
 * ========================================================= */

const customerPinIcon =
    L.divIcon({

        className:
            "customer-pin",

        html: `
            <div class="customer-pin-wrapper">

                <div class="customer-pin-body">

                    <div class="fruit-bowl-icon">

                        <div class="fruit fruit-red"></div>

                        <div class="fruit fruit-orange"></div>

                        <div class="fruit fruit-yellow"></div>

                        <div class="fruit fruit-green"></div>

                        <div class="bowl"></div>

                    </div>

                </div>

            </div>
        `,

        iconSize: [
            72,
            88
        ],

        iconAnchor: [
            36,
            86
        ],

        popupAnchor: [
            0,
            -86
        ]

    });


/* =========================================================
   CUSTOMER MARKER
   ========================================================= */

let customerMarker =
    L.marker(
        [
            DEFAULT_LAT,
            DEFAULT_LNG
        ],
        {
            draggable: true,

            icon:
                customerPinIcon
        }
    ).addTo(map);


/* =========================================================
   INITIAL CHECK
   =========================================================
 *
 * IMPORTANT:
 *
 * Do NOT check the default Hyderabad location
 * automatically.
 *
 * The delivery result will only be shown after
 * the user:
 *
 * - searches
 * - uses current location
 * - drags the marker
 *
 * ========================================================= */


/* =========================================================
   MARKER DRAG
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

searchButton.addEventListener(
    "click",
    searchLocation
);


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
   SEARCH FUNCTION
   ========================================================= */

async function searchLocation() {

    const query =
        locationSearch.value.trim();


    if (!query) {

        alert(
            "Please enter a location."
        );

        return;

    }


    try {

        searchButton.disabled =
            true;


        searchButton.textContent =
            "Searching...";


        const url =
            "https://nominatim.openstreetmap.org/search" +
            "?format=json" +
            "&limit=1" +
            "&q=" +
            encodeURIComponent(
                query +
                ", Hyderabad, India"
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
            !results.length
        ) {

            alert(
                "Location not found. Please try another location."
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


    } catch (error) {

        console.error(
            "Search error:",
            error
        );


        alert(
            "Unable to search this location."
        );


    } finally {

        searchButton.disabled =
            false;


        searchButton.textContent =
            "Search";

    }

}


/* =========================================================
   MOVE MARKER
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


    map.setView(
        [
            lat,
            lng
        ],
        15
    );


    checkDelivery(
        lat,
        lng
    );

}


/* =========================================================
   CURRENT LOCATION
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

            alert(
                "Your browser does not support location services."
            );

            return;

        }


        useLocationButton.disabled =
            true;


        useLocationButton.textContent =
            "Getting your location...";


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


                useLocationButton.textContent =
                    "📍 Use my current location";

            },


            function (error) {

                console.error(
                    "Location error:",
                    error
                );


                alert(
                    "Unable to get your location. Please allow location access."
                );


                useLocationButton.disabled =
                    false;


                useLocationButton.textContent =
                    "📍 Use my current location";

            },


            {
                enableHighAccuracy:
                    true,

                timeout:
                    10000,

                maximumAge:
                    0
            }

        );

    }
);


/* =========================================================
   LOAD DELIVERY AREAS
   =========================================================
 *
 * Delivery areas are now loaded from:
 *
 * data/delivery-areas.json
 *
 * Example:
 *
 * {
 *     "areas": [
 *         [
 *             {
 *                 "lat": 17.385,
 *                 "lng": 78.4867
 *             }
 *         ]
 *     ]
 * }
 *
 * ========================================================= */

async function getDeliveryAreas() {

    try {

        const response =
            await fetch(
                DELIVERY_AREAS_FILE,
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
            !data
            ||
            !Array.isArray(data.areas)
        ) {

            console.error(
                "Invalid delivery area data."
            );

            return [];

        }


        return data.areas;


    } catch (error) {

        console.error(
            "Unable to load delivery areas:",
            error
        );


        return [];

    }

}


/* =========================================================
   CHECK DELIVERY
   ========================================================= */

async function checkDelivery(
    lat,
    lng
) {

    const deliveryAreas =
        await getDeliveryAreas();


    let isInside =
        false;


    for (
        const area of deliveryAreas
    ) {

        if (
            pointInsidePolygon(
                lat,
                lng,
                area
            )
        ) {

            isInside =
                true;

            break;

        }

    }


    showResult(
        isInside
    );

}


/* =========================================================
   POINT INSIDE POLYGON
   =========================================================
 *
 * Ray-casting algorithm.
 *
 * Determines whether a latitude/longitude
 * point is inside a polygon.
 *
 * ========================================================= */

function pointInsidePolygon(
    lat,
    lng,
    polygon
) {

    let inside =
        false;


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
                yi > lat
            ) !== (
                yj > lat
            )
            &&
            (
                lng <
                (
                    (xj - xi)
                    *
                    (lat - yi)
                    /
                    (yj - yi)
                )
                +
                xi
            );


        if (intersect) {

            inside =
                !inside;

        }

    }


    return inside;

}


/* =========================================================
   SHOW RESULT
   ========================================================= */

function showResult(
    available
) {

    const result =
        document.getElementById(
            "result"
        );


    const title =
        document.getElementById(
            "resultTitle"
        );


    const message =
        document.getElementById(
            "resultMessage"
        );


    const icon =
        document.getElementById(
            "resultIcon"
        );


    result.classList.remove(
        "hidden",
        "available",
        "unavailable"
    );


    if (available) {

        result.classList.add(
            "available"
        );


        icon.textContent =
            "✓";


        title.textContent =
            "Yes! We deliver here.";


        message.textContent =
            "Great! Your location is within our delivery area.";

    } else {

        result.classList.add(
            "unavailable"
        );


        icon.textContent =
            "×";


        title.textContent =
            "Sorry, we don't deliver here.";


        message.textContent =
            "We are not currently serving this location.";

    }

}
