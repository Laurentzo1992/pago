var map;
var ZOOM_1_200K = 10;


var menu_width = 400; //Default menu width


const selectedTypes = new Set();
const selectedLocations = new Set();

$(document).ready(function () {

    if (window.mobileAndTabletcheck()) {
        menu_width = 250; //Reduce menu width for portable devices
        $("#slide_menu").css('width', '250px');
    }
    map = new L.map('map', {maxZoom: 18, zoomControl: false});
    //tileLayer: {maxNativeZoom: 19}

    map.setView([12.3569, -1.5352], 10); //Coordinates and zoom level
    //
    // Create base layers objects
    var osm = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18
        , attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    new L.Control.Zoom({ position: 'topright' }).addTo(map);

    map.addLayer(osm);

    //Scale control

    scaleControl = L.control.scale({ metric: true, imperial: false, position: 'bottomright' });
    scaleControl.addTo(map);

    //Zoom to fit control
    var ctlZoomToFit = L.control();

    ctlZoomToFit.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'zoomtofit leaflet-bar'); // create a div with a class "info"
        this._div.title = "Centrer la carte sur Ouagadougou";

        this._div.onclick = function () {
            map.setView([12.3569, -1.5352], 13); //center in Ouagadougou
        };
        L.DomEvent.on(this._div, 'click', function (ev) {
            L.DomEvent.stopPropagation(ev);
        });
        return this._div;
    };
    ctlZoomToFit.addTo(map);

    //Zoom box control

    var ctlZoomBox = L.control.zoomBox({
        modal: false,  // If false (default), it deactivates after each use.
        // If true, zoomBox control stays active until you click on the control to deactivate.
        position: "topright",
        // className: "customClass"  // Class to use to provide icon instead of Font Awesome
        title: "Zoom vers une région spécifique" // a custom title
    });
    map.addControl(ctlZoomBox);




    $.get("/api/types")
        .done(function (types) {
            parseTypes(types);
            $.get("/api/locations")
                .done(parseLocations)
                .fail(function () {
                    alert("Impossible de joindre le serveur");
                });
                ///////////////////////////////////////////////////////

                // infrastructure data and locate

                ///////////////////////////////////////////////////////
                
                $.get("/api/infrastructures")
                .done(parseLocations)
                .fail(function () {
                    alert("Le Géoportail n'est pas disponible présentemment. Veuillez SVP réessayer plus tard.");
                });
            ////////////////////////////////////////////////////////////////
        })
        .fail(function () {
            alert("Impossible de joindre le serveur");
        });



    // map.on('click', function (evt) {
    //     vGetFeatureInfo(evt);
    // });

    // map.on('zoomend', vShowHideLayersToZoom);



});


function parseTypes(types) {
    types.forEach(type => {
        createTypeAccordion(type)
    });

}

function parseLocations(communes) {
    communes.forEach(commune => {
        createCommuneAccordion(commune);
    });

    // Listen to click events on checkboxes
    $("input[type=checkbox]").on("change", function (event) {
        $(this).removeClass('bg-primary');
        $(this).removeClass('border-primary');
        $(this).removeClass('bg-danger');
        $(this).removeClass('border-danger');
        $(this).removeAttr("style");

        event.stopImmediatePropagation();
        // toggleChildren(this);
        if ($(this).parent().hasClass('accordion-button')) {
            // event.stopPropagation();
            toggleChildren(this);
        } else {
            addToSelectedList(this);
        }

        if ($(this).data('parent')) {
            parent = $(this).data('parent');
        } else if ($(this).data('commune')) {
            parent = $(this).data('commune');
        } else if ($(this).data('arrondissement')) {
            parent = $(this).data('arrondissement');
        } else if ($(this).data('secteur')) {
            parent = $(this).data('secteur')
        }

        if (parent)
            updateParentCheckbox(parent);
        
        // console.log('me');
        // if (this.id.startsWith('checkbox-type-')) {
        // }

        // Mettre à jour la liste de Catégories selectionné
        
    });
}




// Helper function to generate accordion items
function generateAccordionItem(item, level, parentId) {

    if (item.children.length > 0) {
        const accordionItem = document.createElement("div");
        accordionItem.className = "accordion-item";

        const heading = document.createElement("h2");
        heading.className = "accordion-header";
        heading.id = `heading-type-${item.id}`;

        const formCheck = document.createElement("div");
        formCheck.className = "form-check accordion-button collapsed";
        formCheck.dataset.bsToggle = "collapse";
        formCheck.dataset.bsTarget = `#collapse-type-${item.id}`;

        const checkbox = document.createElement("input");
        checkbox.className = "form-check-input";
        checkbox.type = "checkbox";
        checkbox.id = `checkbox-type-${item.id}`;
        checkbox.setAttribute("data-parent", `checkbox-type-${parentId}`);
        formCheck.appendChild(checkbox);

        const label = document.createElement("label");
        label.className = "form-check-label";
        label.setAttribute("for", `checkbox-type-${item.id}`);
        label.textContent = item.name;

        formCheck.appendChild(label);


        // heading.appendChild(collapseButton);
        heading.appendChild(formCheck);
        accordionItem.appendChild(heading);

        const accordionCollapse = document.createElement("div");
        accordionCollapse.id = `collapse-type-${item.id}`;
        accordionCollapse.className = "accordion-collapse collapse";
        accordionCollapse.setAttribute("aria-labelledby", `heading-type-${item.id}`);

        const accordionBody = document.createElement("div");
        accordionBody.className = "accordion-body";

        item.children.forEach(child => {
            // Check if the child item has already been processed to avoid duplicates
            if (!child.processed) {
                accordionBody.appendChild(generateAccordionItem(child, level + 1, item.id));
                child.processed = true; // Mark the child as processed
            }
        });

        accordionCollapse.appendChild(accordionBody);
        accordionItem.appendChild(accordionCollapse);
        return accordionItem;
    } else {
        const accordionBody = document.createElement("div");
        accordionBody.className = "accordion-body";

        const formCheck = document.createElement("div");
        formCheck.className = "form-check";

        const checkbox = document.createElement("input");
        checkbox.className = "form-check-input last-level-type";
        checkbox.type = "checkbox";
        checkbox.id = `checkbox-type-${item.id}`;
        checkbox.setAttribute("data-parent", `checkbox-type-${parentId}`);

        const label = document.createElement("label");
        label.className = "form-check-label";
        label.setAttribute("for", `checkbox-type-${item.id}`);
        label.textContent = item.name;

        formCheck.appendChild(checkbox);
        formCheck.appendChild(label);
        accordionBody.appendChild(formCheck);

        return accordionBody;
        // accordionItem.appendChild(accordionBody);
    }

}

function generateCommuneAccordion(commune) {

    if (commune.arrondissements.length > 0) {
        const accordionItem = document.createElement("div");
        accordionItem.className = "accordion-item";

        const heading = document.createElement("h2");
        heading.className = "accordion-header";
        heading.id = `heading-commune-${commune.id}`;

        const formCheck = document.createElement("div");
        formCheck.className = "form-check accordion-button collapsed";
        formCheck.dataset.bsToggle = "collapse";
        formCheck.dataset.bsTarget = `#collapse-commune-${commune.id}`;

        const checkbox = document.createElement("input");
        checkbox.className = "form-check-input";
        checkbox.type = "checkbox";
        checkbox.id = `checkbox-commune-${commune.id}`;

        const label = document.createElement("label");
        label.className = "form-check-label";
        label.setAttribute("for", `checkbox${commune.id}`);
        label.textContent = commune.name;

        formCheck.appendChild(checkbox);
        formCheck.appendChild(label);


        // heading.appendChild(collapseButton);
        heading.appendChild(formCheck);
        accordionItem.appendChild(heading);

        const accordionCollapse = document.createElement("div");
        accordionCollapse.id = `collapse-commune-${commune.id}`;
        accordionCollapse.className = "accordion-collapse collapse";
        accordionCollapse.setAttribute("aria-labelledby", `heading-commune-${commune.id}`);

        const accordionBody = document.createElement("div");
        accordionBody.className = "accordion-body";

        commune.arrondissements.forEach(child => {
            // Check if the child item has already been processed to avoid duplicates
            if (!child.processed) {
                accordionBody.appendChild(generateArrondissementAccordion(child, commune));
                child.processed = true; // Mark the child as processed
            }
        });

        accordionCollapse.appendChild(accordionBody);
        accordionItem.appendChild(accordionCollapse);
        return accordionItem;
    } else {
        const accordionBody = document.createElement("div");
        accordionBody.className = "accordion-body";

        const formCheck = document.createElement("div");
        formCheck.className = "form-check";

        const checkbox = document.createElement("input");
        checkbox.className = "form-check-input";
        checkbox.type = "checkbox";
        checkbox.id = `checkbox-commune-${commune.id}`;

        const label = document.createElement("label");
        label.className = "form-check-label";
        label.setAttribute("for", `checkbox-commune-${commune.id}`);
        label.textContent = commune.name;

        formCheck.appendChild(checkbox);
        formCheck.appendChild(label);
        accordionBody.appendChild(formCheck);

        return accordionBody;
        // accordionItem.appendChild(accordionBody);
    }
}

function generateArrondissementAccordion(arrondissement, commune) {

    if (arrondissement.secteurs.length > 0) {
        const accordionItem = document.createElement("div");
        accordionItem.className = "accordion-item";

        const heading = document.createElement("h2");
        heading.className = "accordion-header";
        heading.id = `heading-arrondissement-${arrondissement.id}`;

        const formCheck = document.createElement("div");
        formCheck.className = "form-check accordion-button collapsed";
        formCheck.dataset.bsToggle = "collapse";
        formCheck.dataset.bsTarget = `#collapse-arrondissement-${arrondissement.id}`;

        const checkbox = document.createElement("input");
        checkbox.className = "form-check-input";
        checkbox.type = "checkbox";
        checkbox.id = `checkbox-arrondissement-${arrondissement.id}`;
        checkbox.setAttribute('data-commune', 'checkbox-commune-' + commune.id);

        const label = document.createElement("label");
        label.className = "form-check-label";
        label.setAttribute("for", `checkbox-arrondissement-${arrondissement.id}`);
        label.textContent = arrondissement.name;

        formCheck.appendChild(checkbox);
        formCheck.appendChild(label);


        // heading.appendChild(collapseButton);
        heading.appendChild(formCheck);
        accordionItem.appendChild(heading);

        const accordionCollapse = document.createElement("div");
        accordionCollapse.id = `collapse-arrondissement-${arrondissement.id}`;
        accordionCollapse.className = "accordion-collapse collapse";
        accordionCollapse.setAttribute("aria-labelledby", `heading-arrondissement-${arrondissement.id}`);

        const accordionBody = document.createElement("div");
        accordionBody.className = "accordion-body";

        arrondissement.secteurs.forEach(child => {
            // Check if the child item has already been processed to avoid duplicates
            if (!child.processed) {
                accordionBody.appendChild(generateSecteurAccordion(child, arrondissement));
                child.processed = true; // Mark the child as processed
            }
        });

        accordionCollapse.appendChild(accordionBody);
        accordionItem.appendChild(accordionCollapse);
        return accordionItem;
    } else {
        const accordionBody = document.createElement("div");
        accordionBody.className = "accordion-body";

        const formCheck = document.createElement("div");
        formCheck.className = "form-check";

        const checkbox = document.createElement("input");
        checkbox.className = "form-check-input";
        checkbox.type = "checkbox";
        checkbox.id = `checkbox-arrondissement-${arrondissement.id}`;
        checkbox.setAttribute('data-commune', 'checkbox-commune-' + commune.id);


        const label = document.createElement("label");
        label.className = "form-check-label";
        label.setAttribute("for", `checkbox-arrondissement-${arrondissement.id}`);
        label.textContent = arrondissement.name;

        formCheck.appendChild(checkbox);
        formCheck.appendChild(label);
        accordionBody.appendChild(formCheck);

        return accordionBody;
        // accordionItem.appendChild(accordionBody);
    }
}

function generateSecteurAccordion(secteur, arrondissement) {

    if (secteur.quartiers.length > 0) {
        const accordionItem = document.createElement("div");
        accordionItem.className = "accordion-item";

        const heading = document.createElement("h2");
        heading.className = "accordion-header";
        heading.id = `heading-secteur-${secteur.id}`;

        const formCheck = document.createElement("div");
        formCheck.className = "form-check accordion-button collapsed";
        formCheck.dataset.bsToggle = "collapse";
        formCheck.dataset.bsTarget = `#collapse-secteur-${secteur.id}`;

        const checkbox = document.createElement("input");
        checkbox.className = "form-check-input";
        checkbox.type = "checkbox";
        checkbox.id = `checkbox-secteur-${secteur.id}`;
        checkbox.setAttribute('data-arrondissement', 'checkbox-arrondissement-' + arrondissement.id);

        const label = document.createElement("label");
        label.className = "form-check-label";
        label.setAttribute("for", `checkbox-secteur-${secteur.id}`);
        label.textContent = secteur.name;

        formCheck.appendChild(checkbox);
        formCheck.appendChild(label);


        // heading.appendChild(collapseButton);
        heading.appendChild(formCheck);
        accordionItem.appendChild(heading);

        const accordionCollapse = document.createElement("div");
        accordionCollapse.id = `collapse-secteur-${secteur.id}`;
        accordionCollapse.className = "accordion-collapse collapse";
        accordionCollapse.setAttribute("aria-labelledby", `heading-secteur-${secteur.id}`);

        const accordionBody = document.createElement("div");
        accordionBody.className = "accordion-body";

        secteur.quartiers.forEach(child => {
            // Check if the child item has already been processed to avoid duplicates
            if (!child.processed) {
                accordionBody.appendChild(generateQuartierAccordion(child, secteur));
                child.processed = true; // Mark the child as processed
            }
        });

        accordionCollapse.appendChild(accordionBody);
        accordionItem.appendChild(accordionCollapse);
        return accordionItem;
    } else {
        const accordionBody = document.createElement("div");
        accordionBody.className = "accordion-body";

        const formCheck = document.createElement("div");
        formCheck.className = "form-check";

        const checkbox = document.createElement("input");
        checkbox.className = "form-check-input";
        checkbox.type = "checkbox";
        checkbox.id = `checkbox-secteur-${secteur.id}`;
        checkbox.setAttribute('data-arrondissement', 'checkbox-arrondissement-' + arrondissement.id);


        const label = document.createElement("label");
        label.className = "form-check-label";
        label.setAttribute("for", `checkbox-secteur-${secteur.id}`);
        label.textContent = secteur.name;

        formCheck.appendChild(checkbox);
        formCheck.appendChild(label);
        accordionBody.appendChild(formCheck);

        return accordionBody;
        // accordionItem.appendChild(accordionBody);
    }
}


function generateQuartierAccordion(quartier, secteur) {

    const accordionBody = document.createElement("div");
    accordionBody.className = "accordion-body";

    const formCheck = document.createElement("div");
    formCheck.className = "form-check";

    const checkbox = document.createElement("input");
    checkbox.className = "form-check-input  quartier";
    checkbox.type = "checkbox";
    checkbox.id = `checkbox-quartier-${quartier.id}`;
    checkbox.setAttribute('data-secteur', 'checkbox-secteur-' + secteur.id);

    const label = document.createElement("label");
    label.className = "form-check-label";
    label.setAttribute("for", `checkbox-quartier-${quartier.id}`);
    label.textContent = quartier.name;

    formCheck.appendChild(checkbox);
    formCheck.appendChild(label);
    accordionBody.appendChild(formCheck);

    return accordionBody;
}





// Helper function to create the accordion with data
function createTypeAccordion(data) {
    const accordionContainer = document.getElementById("types-accordion");
    accordionContainer.appendChild(generateAccordionItem(data, 0, null));
}

function createCommuneAccordion(location) {
    const accordionContainer = document.getElementById("locations-accordion");
    accordionContainer.appendChild(generateCommuneAccordion(location));
}

var markers = new Map();
var pointLayer = L.layerGroup();

// Fonction pour cocher/décocher automatiquement les checkboxes enfants
function toggleChildren(parentCheckbox) {
    var isChecked = parentCheckbox.checked;
    var parentDiv = $(parentCheckbox.closest('.accordion-item')).find('.accordion-body')

    // Trouver tous les checkboxes enfants dans le div parent
    var childrenCheckboxes = parentDiv.find('.form-check-input');

    childrenCheckboxes.each(function () {

        // Effacer ma mise en forme
        $(this).removeClass('bg-primary');
        $(this).removeClass('border-primary');
        $(this).removeClass('bg-danger');
        $(this).removeClass('border-danger');
        $(this).removeAttr("style");

        // Cocher/decocher le checkbox enfant
        this.checked = isChecked;
        this.indeterminate = false;

        // Récupérer l'ID du type (extrait de l'attribut ID)
        var typeId = this.id.replace('checkbox-type-', '');

        // Mettre à jour la liste des types sélectionnés
        // var index = selectedTypes.indexOf(typeId);
        // if (isChecked && index === -1) {
        //     selectedTypes.push(typeId);
        // } else if (!isChecked && index !== -1) {
        //     selectedTypes.splice(index, 1);
        // }
        addToSelectedList(this);
    });
    // getInfrastructures();
}

function addToSelectedList(element) {
    if ($(element).hasClass('last-level-type')) {
        // Récupérer l'ID du type (extrait de l'attribut ID)
        var tId = parseInt(element.id.replace('checkbox-type-', ''));
        selectedTypes.add(tId);
        if (element.checked) {
            selectedTypes.add(tId);
        } else {
            selectedTypes.delete(tId);
        }
    } else if ($(element).hasClass('quartier')) {
        // Récupérer l'ID du type (extrait de l'attribut ID)
        var mId = parseInt(element.id.replace('checkbox-quartier-', ''));
        selectedLocations.add(mId);
        if (element.checked) {
            selectedLocations.add(mId);
        } else {
            selectedLocations.delete(mId);
        }
    }
    // console.log(selectedTypes);
    // console.log(selectedLocations);
}

function updateParentCheckbox(parentId) {
    if (!parentId)
        return;


    var parentCheckbox;
    while (parentId) {
        parentCheckbox = $('#' + parentId);

        if (!parentCheckbox)
            return;

        var match = parentId.match(/[a-zA-Z]+/g);
        model = match[1];

        if (model == 'type')
            model = 'parent';

        var childCheckboxes = $("input[data-" + model + "='" + parentId + "']");
        var checkedCount = childCheckboxes.filter(":checked").length;
        var totalCount = childCheckboxes.length;

        parentCheckbox.removeClass('bg-primary');
        parentCheckbox.removeClass('border-primary');
        parentCheckbox.removeClass('bg-danger');
        parentCheckbox.removeClass('border-danger');
        parentCheckbox.removeAttr("style");

        // Array to store indeterminate checkboxes
        var indeterminateCheckboxes = [];

        // Loop through the checkboxes and check if they are indeterminate
        childCheckboxes.each(function () {
            if ($(this).prop("indeterminate")) {
                indeterminateCheckboxes.push(this);
            }
        });

        // Get the count of indeterminate checkboxes
        var count = indeterminateCheckboxes.length;
        classes = '';
        if (checkedCount === 0) {
            parentCheckbox.prop("indeterminate", count > 0);
            parentCheckbox.prop("checked", false);
            if (count > 0) {
                classes = 'bg-danger border-danger';
            }
        } else if (checkedCount === totalCount) {
            parentCheckbox.prop("indeterminate", false);
            parentCheckbox.prop("checked", true);

        } else {
            parentCheckbox.prop("indeterminate", true);
            parentCheckbox.prop("checked", false);


            classes = 'bg-danger border-danger';
        }
        parentCheckbox.addClass(classes);

        if (parentCheckbox.data('parent')) {
            parentId = parentCheckbox.data('parent');
        } else if (parentCheckbox.data('commune')) {
            parentId = parentCheckbox.data('commune');
        } else if (parentCheckbox.data('arrondissement')) {
            parentId = parentCheckbox.data('arrondissement');
        } else if (parentCheckbox.data('secteur')) {
            parentId = parentCheckbox.data('secteur');
        } else {
            parentId = undefined;
        }
    }
}

function toggleLeftPane() {
    if (window.mobileAndTabletcheck()) {
        menu_width = 250; //Reduce menu width for portable devices
        $("#slide_menu").css('width', '250px');
    }
    $('#slide_menu').toggleClass('slide_menu_visible');
    $('#slide_button').toggleClass('slide_button_visible');
    $('#legend').toggleClass('legend_visible');
    $('#slide_button .fas').toggleClass('fa-rotate-180');
}


window.mobileAndTabletcheck = function () {
    var check = false;
    (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
};