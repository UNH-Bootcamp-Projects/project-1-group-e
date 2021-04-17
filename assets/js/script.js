'use strict';

$(function (){
    let elements = {
        searchForm: $('.js-search-form'),
        showMoreBtn: $('.js-load-more'),
    }

    let gameApiData = {
        url: 'https://www.giantbomb.com/api/',
        key: 'ca21f96f411cc413f9234dbec4a20f729ca3fb2b',
        format: 'json',
    }

    /* Game Search */

    function proxyFetch(url, options) {
        url = 'https://ben.hutchins.co/proxy/fetch/' + url;

        return fetch(url, options);
    }

    function searchGames(event) {
        console.log('%c Get Searched Game Data ', 'color: #05AFF2;');
        event.preventDefault();

        let eventElem = $(event.currentTarget);
        let isForm = eventElem.is('form');
        let isLoadMore = eventElem.is(elements.showMoreBtn);

        let searchQuery = '';
        let page = 1;

        if (isForm) {
            searchQuery = eventElem.find('input[type="search"]').val().trim();
        }

        if (isLoadMore) {
            searchQuery = eventElem.data('search-query');
            page = eventElem.data('page');
        }

        let requestUrl = `${gameApiData.url}search/?format=${gameApiData.format}&api_key=${gameApiData.key}&resources=game&query=${encodeURI(searchQuery)}&page=${page}`;

        proxyFetch(requestUrl)
            .then((response) => {
                // console.log(response);
                if (response.ok){
                    return response.json();
                }
            })
            .then((body) => {
                console.log(body);
                if (body !== undefined) {
                    displayGamesSearchResults(body.results);

                    let itemOnPage = body.number_of_page_results;
                    let loadLimit = body.limit;

                    if (itemOnPage === loadLimit) {
                        elements.showMoreBtn
                            .data({
                                'search-query': searchQuery,
                                'page': ++page,
                            })
                            .removeAttr('disabled')
                            .removeClass('hide')
                            .on('click.loadMore', loadMoreResults);
                    } else {
                        elements.showMoreBtn.addClass('hide');
                    }
                }
            });
    }

    function loadMoreResults(event) {
        console.log('%c Load More Results ', 'color: #05AFF2;');
        $(event.currentTarget)
            .attr('disabled', true)
            .off('click.loadMore');

        searchGames(event);
    }

    function displayGamesSearchResults(searchedData) {
        console.log('%c Display Game Search Results ', 'color: #F24141;');

        searchedData.forEach((item) => {
            let displayedData = {
                gameName: item.name, // alternative 'item.aliases'
                // gameDesc: item.deck,
                gameThumb: item.image.thumb_url,
                // releaseDate: item.original_release_date,
                // platformNames: item.platforms.map((currentValue) => currentValue.name),
                // gameImage: item.image.medium_url, // alternative 'item.image.original_url'
                // gaintBombUrl: item.site_detail_url,
                gameId: item.guid,
            };
        });
    }

    /* END Game Search */

    function init() {
        console.log('%c Init', 'color: #0455BF;');

        elements.searchForm.on('submit', searchGames);
        // Initialize collapse button
        $('.sidenav').sidenav();
    }

    init();
});
