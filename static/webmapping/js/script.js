$(document).ready(function () {

    
    
    // Add filter pane collapser event listener
    $('#collapse-button').on('click', function () {
        $('#slideMenu').toggleClass('visible');
        $('#collapse-button .fas').toggleClass('fa-rotate-180');
    });
    
    // Create a Leaflet map instance
    map = L.map('map').setView([12.3569, -1.5352], 13);

    // Add a tile layer to the map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
        maxZoom: 18,
    }).addTo(map);

    var jsonData;

    $.getJSON('/static/webmapping/data.json', function (data) {
        jsonData = data;
        // Remplir le menu déroulant des catégories
        var categorySelect = $('#category');
        $.each(data, function (index, category) {
            if (category.Category != 'N/A') {
                categorySelect.append($('<option></option>').text(category.Category));
            }
        });

        // Remplir le menu déroulant des sous-catégories
        var subCategorySelect = $('#subcategory');
        $.each(data[0].Subcategories, function (index, subcategory) {
            if (subcategory.Subcategory != 'N/A') {
                subCategorySelect.append($('<option></option>').text(subcategory.Subcategory));
            }
        });

        var markers = new Map();
        var pointLayer = L.layerGroup();

        var selectedCategory = data[0].Category;
        var selectedSubCategory = data[0].Subcategories[0].Subcategory;

        loadItems(data[0].Subcategories[0].Items);

        var selectedSubCategoryData = null;
        var selectedCategoryData = null;

        // Mettre à jour la liste des sous-catégories en fonction de la catégorie sélectionnée
        categorySelect.on('change', function () {
            selectedCategory = $(this).val();
            $("#result-list").empty(); // Reinitialiser la liste du contenu

            pointLayer.clearLayers(); // Effacer les marqueurs existants
            markers.clear(); // Effacer les references des marqueurs

            // Trouver la catégorie sélectionnée dans les données JSON
            selectedCategoryData = data.find(function (category) {
                return category.Category === selectedCategory;
            });

            subCategorySelect.empty(); // Réinitialiser la liste des sous-catégories


            if (selectedCategoryData) {
                // Charger la nouvelle liste de sous-categories
                $.each(selectedCategoryData.Subcategories, function (index, subcategory) {
                    if (subcategory.Subcategory != 'N/A') {
                        subCategorySelect.append($('<option></option>').text(subcategory.Subcategory));
                    }
                });

                if (selectedSubCategory) {
                    selectedSubCategoryData = selectedCategoryData.Subcategories.find(function (category) {
                        return (
                            category.Subcategory === selectedSubCategory
                        );
                    });
                } else {
                    selectedSubCategoryData = selectedCategoryData.Subcategories[0];
                }
                loadItems(selectedSubCategoryData.Items);
            }
        });

        subCategorySelect.on('change', function () {
            pointLayer.clearLayers(); // Effacer les marqueurs existants
            $("#result-list").empty(); // Reinitialiser la liste du contenu
            selectedSubCategory = $(this).val();
            selectedSubCategoryData = selectedCategoryData.Subcategories.find(function (subcategory) {
                return (
                    subcategory.Subcategory === selectedSubCategory
                );
            });
            markers.clear();
            if (selectedSubCategoryData) {
                loadItems(selectedSubCategoryData.Items);
            }
        });

        function loadItems(items) {
            $.each(items, function (index, item) {
                // Remplir le menu déroulant des sous-catégories avec les noms correspondants
                $("#result-list").append($('<li class="list-group-item list-group-item-action" item-category="' + selectedCategory +
                    '" item-subcategory="' + subcategory.Subcategory +
                    '" item-index="' + index + '"></li>').text(item["Nom de l'infrastructure"]));
                // Place le marqueur correspondant a l'element sur la carte
                var coodinates = item["Coordonn\u00e9es g\u00e9ographiques"];
                var bindPopupContent = '<b>' + item["Nom de l'infrastructure"] + '</b><br>' +
                '                       <b>Emplacement: </b>' + item["Emplacement de l\u2019infrastructure par rapport \u00e0 la voie"] + '<br>' +
                                       '<b>Commune: </b>' + item["Commune"] + '<br>' +
                                       '<b>Arrondissement/Village: </b>' + item["Arrondissement/Village"] + '<br>' +
                                       '<b>Secteur: </b>' + item["Secteur"] + '<br>';
                var marker = L.marker([coodinates.latitude, coodinates.longitude]).addTo(pointLayer).bindPopup(bindPopupContent);
                markers.set(item["Nom de l'infrastructure"], marker);
            });
            pointLayer.addTo(map);
        }
    });

    $(document).on('click', '#result-list  li', function (e) {
        var $clickedItem = $(e.target);
        var category = $clickedItem.attr('item-category');
        var subcategory = $clickedItem.attr('item-subcategory');
        var itemIndex = $clickedItem.attr('item-index');

        var item = selectedSubCategoryData.Items[itemIndex];
        var coodinates = item["Coordonn\u00e9es g\u00e9ographiques"];
        map.setView([coodinates.latitude, coodinates.longitude], 20);
        markers.get(item["Nom de l'infrastructure"]).openPopup();
    });
});