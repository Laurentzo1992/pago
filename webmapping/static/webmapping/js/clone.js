var map;
var aOverlays = [];
var aOverlaysByGeometry = [];
var selectedFeatureLayers = [];
var aliases = {};
//var GeoServerURL = "http://localhost:8080/geoserver/";
//var GeoServerURL = "http://www.bumigeb.bf:8080/geoserver/";
var GeoServerURL = "http://51.79.86.127:8080/geoserver/";
//https://gis.stackexchange.com/questions/210109/enabling-cors-in-geoserver-jetty
var ZOOM_1_200K = 10;

var ciGeometry_Raster = 1;
var ciGeometry_Polygon = 2;
var ciGeometry_Polyline = 3;
var ciGeometry_Point = 4;

var menu_width = 400; //Default menu width

pointLayers = []

var selectedTypes = [];

$(document).ready(function () {


    if (window.mobileAndTabletcheck()) {
        menu_width = 250; //Reduce menu width for portable devices
        $("#slide_menu").css('width', '250px');
    }
    map = new L.map('map', { maxZoom: 18, zoomControl: false });
    //tileLayer: {maxNativeZoom: 19}

    map.setView([12.3569, -1.5352], 13); //Coordinates and zoom level
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
        })
        .fail(function () {
            alert("Impossible de joindre le serveur");
        });



    map.on('click', function (evt) {
        vGetFeatureInfo(evt);
    });

    map.on('zoomend', vShowHideLayersToZoom);



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
        checkbox.className = "form-check-input";
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
    checkbox.className = "form-check-input";
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
        var index = selectedTypes.indexOf(typeId);
        if (isChecked && index === -1) {
            selectedTypes.push(typeId);
        } else if (!isChecked && index !== -1) {
            selectedTypes.splice(index, 1);
        }
    });
    // getInfrastructures();
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




function vParseCapabilitiesResponse(responseXML) {
    if (responseXML === undefined)
        return;
    $xml = $($.parseXML(responseXML));
    var groupID;
    var unnumbered = 101;
    $xml.find("Layer").first().children("Layer").each(function () {

        if ($(this).children("Layer").length > 0) //We have a group
        {
            var groupName = $(this).children("Title").text();
            //We assume group number is a prefix of the name (example : 02 Geochimie)
            groupID = parseInt(groupName);
            if (isNaN(groupID))
                groupID = unnumbered++;
            //Remove numeric prefix by seraching for first letter
            groupName = groupName.substring(groupName.stripAccents().search(/[a-zA-Z]/));

            $(this).children("Layer").each(function () {
                var layerTitle = $(this).children("Title").text();
                var layerName = $(this).children("Name").text();
                if (layerName.toLowerCase().lastIndexOf("bumigeb", 0) === 0) // (equivalent to StartsWith(), ie searches if prefix is "bumigeb")
                {
                    vAddLayer(layerName, layerTitle, groupID, groupName);
                }

            });

        }
        else {
            var layerTitle = $(this).children("Title").text();
            var layerName = $(this).children("Name").text();
            if (layerName.toLowerCase().lastIndexOf("bumigeb", 0) === 0) // (equivalent to StartsWith(), ie searches if prefix is "bumigeb")
            {
                groupID = parseInt(layerTitle);
                if (isNaN(groupID))
                    groupID = unnumbered++;
                vAddLayer(layerName, layerTitle, groupID, layerTitle);

            }
        }
    });

    //Order layers by group ID or alphabetically
    aOverlays.sort(function (a, b) {
        //For unnumbered groups, order alphabetically
        if (a.groupID > 100 && b.groupID > 100) {
            if (a.groupName.stripAccents() < b.groupName.stripAccents()) return -1;
            if (a.groupName.stripAccents() > b.groupName.stripAccents()) return 1;
        }
        else //else order by group ID
        {
            if (a.groupID < b.groupID) return -1;
            if (a.groupID > b.groupID) return 1;
        }
        if (a.title < b.title) return -1;
        if (a.title > b.title) return 1;
        return 0;
    });

    var typeName = "";

    for (var id = 0; id < aOverlays.length; id++) {
        var Overlay = aOverlays[id];
        Overlay.id = id;
        if (Overlay.groupName !== typeName) {
            typeName = aOverlays[id].groupName;
            var groupHeader = $('<button class="accordion" onClick = "vToggle(this,\'panel' + Overlay.groupID + '\')" >' + Overlay.groupName + '</button>');
            var groupDiv = $('<div id = "panel' + Overlay.groupID + '" class="panel"> </div>');
            $('#slide_menu').append(groupHeader);
            $('#slide_menu').append(groupDiv);
        }

        var chkbox = $('<input />', { type: 'checkbox', id: 'chkbox' + id, value: Overlay.title, class: 'layer_checkbox' });
        chkbox.change(function () {
            //var cid = parseInt(this.id);
            var cid = parseInt((this.id).match(/\d+/).shift(), 10);
            if (cid >= 0 && cid < aOverlays.length) {
                $("#legend").css('display', 'none');
                $('#transp-slider' + cid).css('display', 'none');
                if (this.checked) {
                    aOverlays[cid].layer.addTo(map);
                    aOverlays[cid].active = true;
                    // Only put symbol if not raster
                    if (aOverlays[cid].geometry > ciGeometry_Raster)
                        $('#symbol' + cid).css('display', 'block');

                    //Add transparency slider for raster and polygons
                    if (aOverlays[cid].geometry <= ciGeometry_Polygon) {
                        $('#transp-slider' + cid).css('display', 'block');
                        var grID = aOverlays[cid].groupID;
                        $('#panel' + grID).css('maxHeight', $('#panel' + grID).prop('scrollHeight') + 'px');
                    }

                }
                else {
                    aOverlays[cid].layer.removeFrom(map);
                    aOverlays[cid].active = false;

                    $('#symbol' + cid).css('display', 'none');


                    while (selectedFeatureLayers.length > 0) {
                        map.removeLayer(selectedFeatureLayers.pop());
                    }
                    map.closePopup();
                }
            }
        });

        var label = $('<label />', { 'for': 'chkbox' + id, id: 'layer_label' + id, text: Overlay.title, class: 'layer_label' });
        if (Overlay.minZoomLevel === ZOOM_1_200K)
            $(label).prop('title', 'Cette couche est disponible à une échelle 1:200000 et plus');
        var image_url = GeoServerURL + 'wms?service=WMS&version=1.1.0&request=GetLegendGraphic&FORMAT=image/png&WIDTH=16&HEIGHT=16&LAYER=' + Overlay.name + '&TRANSPARENT=true';
        var image = $('<img class="layer_symbol" id = "symbol' + id + '" src="' + image_url + '" data-original-src="' + image_url + '" alt="layer">');
        var transp_slider = $('<input type="range" class="layer_slider" id="transp-slider' + id + '" style = "display: none" value="100" oninput="" onchange="vChangeTransparency(this.value,' + id + ')" />');
        $(image).css('display', 'none');
        image.on('load', function () {
            if (this.width > 16 || this.height > 16) {
                var cid = parseInt(($(this).attr("id")).match(/\d+/).shift(), 10);
                aOverlays[cid].hasLegend = true;

                $(this).attr('src', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAATUlEQVQ4T2NkoBAwUqifAdmADwwMDPwMDAwgWpBYg5EN+M/AADYQRoPMALFxAbBebC74yMDAIECOC4jVg6JuNAywx8JITgcUJySyDAAAoroVERwBXkkAAAAASUVORK5CYII=');

                $(this).click(function () {
                    var image_src = $(this).data("original-src");
                    $("#legend").css('display', 'block');
                    $("#legend_image").attr('src', image_src);
                    $("#legend").data('overlay_id', cid);
                });
                $(this).hover(function () {
                    $(this).css('cursor', 'pointer');
                    $(this).attr('src', ' data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4QgYER4hMd2w8AAAAFdJREFUOMvtk0EKgDAMBKfiPX3D/v9L3TfYF+ipIoiCxGP3lEN2CAMprbWdRBaSWccgqQMBbLbrZwAQtpFUL9DHou0boEsKYFxyLr2lZCVOB9PBL8+UBhyafT7kKtC7kAAAAABJRU5ErkJggg==');
                }, function () {
                    $(this).css('cursor', 'auto');
                    $(this).attr('src', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAATUlEQVQ4T2NkoBAwUqifAdmADwwMDPwMDAwgWpBYg5EN+M/AADYQRoPMALFxAbBebC74yMDAIECOC4jVg6JuNAywx8JITgcUJySyDAAAoroVERwBXkkAAAAASUVORK5CYII=');

                });

            }

        });

        var grID = Overlay.groupID;

        $('#panel' + grID).append(chkbox);
        $('#panel' + grID).append(label);
        $('#panel' + grID).append(image);
        $('#panel' + grID).append(transp_slider);
        $('#panel' + grID).append($('<br>'));

    }

    vCheckFeatureTypeInfo(0);

    vShowHideLayersToZoom();
}

function vAddLayer(layerName, layerTitle, groupID, groupName) {
    var wmsPath;
    /*  if (layerName === "bumigeb:Hydrogeologie")
          wmsPath = GeoServerURL + 'wms';
      else*/
    wmsPath = GeoServerURL + 'gwc/service/' + 'wms';

    var new_layer = L.tileLayer.wms(wmsPath,
        {
            format: 'image/png',
            transparent: true,
            layers: layerName,
            styles: ''
            //opacity: 0.5,
            //errorTileUrl:"warning.png"
        });
    //new_layer.options.crs = L.CRS.EPSG4326;

    var NewOverlay = { layer: new_layer, active: false, name: layerName, title: layerTitle, groupID: groupID, groupName: groupName, geometry: -1, hasLegend: false, minZoomLevel: 0 };
    if (groupName.indexOf(200000) !== -1)
        NewOverlay.minZoomLevel = ZOOM_1_200K;

    aOverlays.push(NewOverlay);
}

function vCheckFeatureTypeInfo(layer_index) {
    if (layer_index < 0 || layer_index >= aOverlays.length)
        return;
    var Overlay = aOverlays[layer_index];

    $.get(GeoServerURL + "wfs?service=wfs&version=2.0.0&request=GetFeature&typeNames=" + Overlay.name + '&count=1', '', null, 'text')
        .done(function (response) {
            Overlay.geometry = iParseGetFeatureResponse(response);
            //Exception : treat feuillets as polylines
            if (Overlay.name.toLowerCase() === "bumigeb:feuillets_200k")
                Overlay.geometry = ciGeometry_Polyline;

            Overlay.layer.setZIndex(Overlay.geometry);
            if (Overlay.geometry === ciGeometry_Raster) {
                $('#symbol' + layer_index).css("display", "none");
            }
        })
        .always(function () {
            layer_index++;
            if (layer_index < aOverlays.length) {
                vCheckFeatureTypeInfo(layer_index);
            }
            else {
                //Used by GetFeatureInfo function
                aOverlaysByGeometry = aOverlays.slice(0).sort(function (a, b) {

                    //Exception : Put "Feuillets at the end"
                    if (a.name.toLowerCase() === "bumigeb:feuillets_200k")
                        return 1;
                    //Inverse ordering
                    if (a.geometry > b.geometry) return -1;
                    if (a.geometry < b.geometry) return 1;
                    return 0;
                });
            }
        });

}

function iParseGetFeatureResponse(response) {
    if (response.indexOf('<gml:Polygon') > -1) {
        return ciGeometry_Polygon;
    }
    else if (response.indexOf('<gml:LineString') > -1) {
        return ciGeometry_Polyline;
    }
    else if (response.indexOf('<gml:Point') > -1) {
        return ciGeometry_Point;
    }
    else
        return ciGeometry_Raster;

}

function vGetFeatureInfo(evt) {
    while (selectedFeatureLayers.length > 0) {
        map.removeLayer(selectedFeatureLayers.pop());
    }
    var popup_html = "";

    for (var i = 0; i < aOverlaysByGeometry.length; i++) {
        if (aOverlaysByGeometry[i].active && map.hasLayer(aOverlaysByGeometry[i].layer) && aOverlaysByGeometry[i].geometry > ciGeometry_Raster) {
            var url = sGetFeatureInfoUrl(evt.latlng, aOverlaysByGeometry[i].layer);

            $.ajax({
                url: url,
                success: function (data, status, xhr) {
                    //For raster files, there is no information on geometry, add it.
                    if (data.features.length > 0) {
                        if (data.features[0].geometry === null) {
                            data.features[0].geometry = { coordinates: new Array(evt.latlng.lat, evt.latlng.lng), type: "Point" };
                        }
                    }
                    var temp = L.geoJson(data,
                        {
                            onEachFeature: function (feature, layer) {
                                selectedFeatureLayers.push(layer);
                                layer.addTo(map);
                                popup_html += "<div class='marker-popup'>";

                                var layId = feature.id.split('.')[0];
                                //var matchedOverlay = aOverlays.find(function(element)
                                //    {return element.name.includes(layId);});
                                var matchedOverlay = aOverlays.filter(function (element) { return (element.name.indexOf(layId) > -1); })[0];
                                if (matchedOverlay !== undefined)
                                    popup_html += '<h1>' + matchedOverlay.title + '</h1>';
                                var keys = Object.keys(feature.properties);

                                popup_html += '<table>';
                                for (var i = 0; i < keys.length; i++) {
                                    if (keys[i].toLowerCase() === "code") //Do not show "CODE" property on popup
                                        continue;
                                    var key_alias = (keys[i] in aliases) ? aliases[keys[i]] : keys[i];
                                    var prop_value = feature.properties[keys[i]];
                                    if (prop_value && !isNaN(prop_value)) //Check if we have a numeric value
                                    {
                                        if (parseInt(prop_value) !== parseFloat(prop_value)) //Check if we have a float number with decimals
                                        {
                                            prop_value = parseFloat(prop_value).toFixed(1).toString(); //Round number to one decimal
                                        }
                                    }
                                    if (!prop_value)
                                        prop_value = 'Inconnu(e)';
                                    popup_html += '<tr><td>' + key_alias + '&nbsp;&nbsp;</td><td>' + prop_value + '</td></tr>';
                                }
                                popup_html += '</table>';
                                popup_html += "</div>";

                                var popup = L.popup({ maxWidth: 600, maxHeight: 300 })
                                    .setContent(popup_html);
                                layer.bindPopup(popup);
                                layer.openPopup();
                                //If the user clicks on feature, make another request
                                // (for example, in case the user clicks on a point feature inside a selected polygon feature)
                                layer.on('click', function (evt) {
                                    vGetFeatureInfo(evt);
                                });

                            },
                            pointToLayer: function (feature, latlng) {
                                var yellowIcon = L.icon({
                                    iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4QkBECUCvrt1KAAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAABg0lEQVRIx7XWMWsVQRTF8d8sifoQbAQNQQKCaEqFgSBEkQh+gnwCCystrCz8DBa2prW0srLQSiUGFqxEjIUSFIP6QFFilOjYzIbhSZ5rdj2wze5y/jPnzt67/GeFcQ/rZAJHcQSH8+2feIu1GLzZFaBOBpjHXAZMYW9+P+E73uMlHsRgpTWgTg7gEhYwaJHCJu7H4MZfAdn8Ks6i+oeof+FJDK7vCOhg3ihheRRSFZlf7GDeLPZ0nVz7A4CTuNDBvIScr5Mz24B8FOdaFrSNJrFY7mAKJ3r+vmbqZKYETPcM2N8susLBHuNpNIHjeijqOO1rAFv56lOpLPI6PvQM+IG1EvCqZ8AXvIAqBkM8L7fVgz5jtSzy04bYgzbwMAab24AYrOI2PnY038IK7o72IjF4jJsYdjB/hKUYfBo3cOZxBYd2YX4rBu/ajMxZXM5f42SLzO/g3qj52KFfJxWO4RxO5Z61J0+vr3iGZbzGsIyl9V9FBoXcqwZFz0r4ho3mtOyk35GIY9QizLXHAAAAAElFTkSuQmCC',
                                    iconSize: [16, 16], // size of the icon
                                    iconAnchor: [8, 8], // point of the icon which will correspond to marker's location
                                    popupAnchor: [0, -8] // point from which the popup should open relative to the iconAnchor
                                });
                                return L.marker(latlng, { icon: yellowIcon });
                            },
                            style: { //For polylines and polygons
                                "color": "#ccff00",
                                "weight": 5,
                                "opacity": 0.8
                            }

                        }
                    );
                },
                error: function (xhr, status, error) {
                    //showGetFeatureInfo(-1, error);
                }
            });

        }
    }
}

function sGetFeatureInfoUrl(latlng, tileLayer) {
    // Construct a GetFeatureInfo request URL given a point
    var point = map.latLngToContainerPoint(latlng, map.getZoom()),
        size = map.getSize(),

        params =
        {
            request: 'GetFeatureInfo',
            service: 'WMS',
            srs: 'EPSG:4326',
            styles: tileLayer.wmsParams.styles,
            transparent: tileLayer.wmsParams.transparent,
            version: tileLayer.wmsParams.version,
            format: tileLayer.wmsParams.format,
            bbox: map.getBounds().toBBoxString(),
            height: size.y,
            width: size.x,
            layers: tileLayer.wmsParams.layers,
            query_layers: tileLayer.wmsParams.layers,
            info_format: 'application/json'
            //info_format: 'text/plain'
            //info_format :'application/vnd.ogc.gml'
        };

    params[params.version === '1.3.0' ? 'i' : 'x'] = point.x;
    params[params.version === '1.3.0' ? 'j' : 'y'] = point.y;

    return tileLayer._url + L.Util.getParamString(params, tileLayer._url, true);
}

function vShowHideLayersToZoom() {
    for (var id = 0; id < aOverlays.length; id++) {
        if (map.getZoom() < aOverlays[id].minZoomLevel) {
            $('#chkbox' + id).prop('disabled', true);
            $('#layer_label' + id).prop('disabled', true);
            $('#symbol' + id).css('display', 'none');
            //Only close legend if it corresponds to the current one
            if (id === $("#legend").data('overlay_id'))
                vCloseLegend();

            if (aOverlays[id].active) {
                aOverlays[id].layer.removeFrom(map);
                map.closePopup();
                while (selectedFeatureLayers.length > 0) {
                    map.removeLayer(selectedFeatureLayers.pop());
                }
            }
        }
        else {
            $('#chkbox' + id).prop('disabled', false);
            $('#layer_label' + id).prop('disabled', false);
            // Only put symbol if not raster and if active
            if (aOverlays[id].geometry > ciGeometry_Raster && aOverlays[id].active)
                $('#symbol' + id).css('display', 'block');
            if (aOverlays[id].active && !map.hasLayer(aOverlays[id].layer))
                aOverlays[id].layer.addTo(map);
        }
    }
}

function toggleLeftPane() {
    $('#slide_menu').toggleClass('slide_menu_visible');
    $('#slide_button').toggleClass('slide_button_visible');
    $('#legend').toggleClass('legend_visible');
    $('#slide_button .fas').toggleClass('fa-rotate-180');
}

function vToggle(button, panelName) {
    button.classList.toggle("active");
    var panel = document.getElementById(panelName);

    if (panel.style.maxHeight) {
        panel.style.maxHeight = null;
    } else {
        panel.style.maxHeight = panel.scrollHeight + "px";
    }
}

function vCloseLegend() {
    $("#legend").css('display', 'none');
}

String.prototype.stripAccents = function () {
    var translate_re = /[àáâãäçèéêëìíîïñòóôõöùúûüýÿÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ]/g;
    var translate = 'aaaaaceeeeiiiinooooouuuuyyAAAAACEEEEIIIINOOOOOUUUUY';
    return (this.replace(translate_re, function (match) {
        return translate.substr(translate_re.source.indexOf(match) - 1, 1);
    })
    );
};

function vChangeTransparency(value, id) {
    aOverlays[id].layer.setOpacity(value / 100.0);
}

window.mobileAndTabletcheck = function () {
    var check = false;
    (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
};