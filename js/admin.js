/* =========================================================
DELIVERY AREA ADMIN
===================

*
* Handles:
*
* * Hardcoded login
* * Map
* * Drawing polygons
* * Editing polygons
* * Deleting polygons
* * Saving polygons
* * Loading saved polygons
*
* ========================================================= */

/* =========================================================
ADMIN CREDENTIALS
=================

*
* TEMPORARY ONLY.
*
* Change these values whenever you want.
*
* ========================================================= */

const ADMIN_USERNAME = "admin";

const ADMIN_PASSWORD = "fruit123";

/* =========================================================
LOGIN ELEMENTS
========================================================= */

const loginScreen =
document.getElementById(
"loginScreen"
);

const adminScreen =
document.getElementById(
"adminScreen"
);

const username =
document.getElementById(
"username"
);

const password =
document.getElementById(
"password"
);

const loginButton =
document.getElementById(
"loginButton"
);

const loginError =
document.getElementById(
"loginError"
);

/* =========================================================
LOGIN
========================================================= */

loginButton.addEventListener(
"click",
login
);

password.addEventListener(
"keydown",
function (event) {

 
    if (event.key === "Enter") {

        login();

    }

}
 

);

function login() {

 
const enteredUsername =
    username.value.trim();


const enteredPassword =
    password.value;


if (
    enteredUsername === ADMIN_USERNAME
    &&
    enteredPassword === ADMIN_PASSWORD
) {

    loginScreen.classList.add(
        "hidden"
    );


    adminScreen.classList.remove(
        "hidden"
    );


    initializeAdminMap();


} else {

    loginError.textContent =
        "Invalid username or password.";

}
 

}

/* =========================================================
LOGOUT
========================================================= */

const logoutButton =
document.getElementById(
"logoutButton"
);

logoutButton.addEventListener(
"click",
function () {

 
    adminScreen.classList.add(
        "hidden"
    );


    loginScreen.classList.remove(
        "hidden"
    );


    username.value = "";

    password.value = "";

    loginError.textContent = "";

}
 

);

/* =========================================================
MAP VARIABLES
========================================================= */

let adminMap = null;

let drawnItems = null;

/* =========================================================
INITIALIZE MAP
========================================================= */

function initializeAdminMap() {

 
if (adminMap !== null) {

    adminMap.invalidateSize();

    return;

}


adminMap =
    L.map("adminMap").setView(
        [17.3850, 78.4867],
        11
    );


/* =====================================================
   FREE OPENSTREETMAP-BASED MAP TILES
   =====================================================

   Uses the OSM France tile server.

   No API key is required.

   ===================================================== */

L.tileLayer(
    "https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png",
    {
        maxZoom: 20,

        attribution:
            '&copy; OpenStreetMap contributors'
    }
).addTo(adminMap);


/* =====================================================
   LAYER FOR POLYGONS
   ===================================================== */

drawnItems =
    new L.FeatureGroup();


adminMap.addLayer(
    drawnItems
);


/* =====================================================
   DRAWING CONTROLS
   ===================================================== */

const drawControl =
    new L.Control.Draw({

        position: "topright",

        draw: {

            polyline: false,

            rectangle: false,

            circle: false,

            circlemarker: false,

            marker: false,

            polygon: {

                allowIntersection: false,

                showArea: true,

                shapeOptions: {

                    color: "#22c55e",

                    fillColor: "#22c55e",

                    fillOpacity: 0.25

                }

            }

        },

        edit: {

            featureGroup:
                drawnItems,

            remove: true

        }

    });


adminMap.addControl(
    drawControl
);


/* =====================================================
   LOAD EXISTING AREAS
   ===================================================== */

loadSavedAreas();


/* =====================================================
   POLYGON CREATED
   ===================================================== */

adminMap.on(
    L.Draw.Event.CREATED,
    function (event) {

        const layer =
            event.layer;


        drawnItems.addLayer(
            layer
        );

    }
);


/* =====================================================
   POLYGON EDITED
   ===================================================== */

adminMap.on(
    L.Draw.Event.EDITED,
    function () {

        console.log(
            "Delivery area edited."
        );

    }
);


/* =====================================================
   POLYGON DELETED
   ===================================================== */

adminMap.on(
    L.Draw.Event.DELETED,
    function () {

        console.log(
            "Delivery area deleted."
        );

    }
);
 

}

/* =========================================================
SAVE BUTTON
========================================================= */

const saveButton =
document.getElementById(
"saveButton"
);

saveButton.addEventListener(
"click",
saveAreas
);

/* =========================================================
SAVE AREAS
========================================================= */

function saveAreas() {

 
const areas = [];


drawnItems.eachLayer(
    function (layer) {

        if (
            layer instanceof
            L.Polygon
        ) {

            const latLngs =
                layer.getLatLngs();


            /*
             * Polygon normally contains
             * one array of coordinates.
             */

            const points =
                latLngs[0].map(
                    function (point) {

                        return {

                            lat: point.lat,

                            lng: point.lng

                        };

                    }
                );


            areas.push(
                points
            );

        }

    }
);


localStorage.setItem(
    "fruitDeliveryAreas",
    JSON.stringify(areas)
);


alert(
    "Delivery areas saved successfully!"
);
 

}

/* =========================================================
LOAD SAVED AREAS
========================================================= */

function loadSavedAreas() {

 
const stored =
    localStorage.getItem(
        "fruitDeliveryAreas"
    );


if (!stored) {

    return;

}


try {

    const areas =
        JSON.parse(stored);


    areas.forEach(
        function (area) {

            const coordinates =
                area.map(
                    function (point) {

                        return [
                            point.lat,
                            point.lng
                        ];

                    }
                );


            const polygon =
                L.polygon(
                    coordinates,
                    {

                        color:
                            "#22c55e",

                        fillColor:
                            "#22c55e",

                        fillOpacity:
                            0.25

                    }
                );


            drawnItems.addLayer(
                polygon
            );

        }
    );


} catch (error) {

    console.error(
        "Unable to load saved areas.",
        error
    );

}
 

}

/* =========================================================
CLEAR ALL
========================================================= */

const clearButton =
document.getElementById(
"clearButton"
);

clearButton.addEventListener(
"click",
function () {

 
    const confirmed =
        confirm(
            "Are you sure you want to delete all delivery areas?"
        );


    if (!confirmed) {

        return;

    }


    drawnItems.clearLayers();


    localStorage.removeItem(
        "fruitDeliveryAreas"
    );


    alert(
        "All delivery areas have been cleared."
    );

}
 

);
