'use strict';

$(function (){
    function init() {
        console.log('%c Init', 'background-color: #333; color: #FFE849;');
        // Initialize collapse button
        $(document).ready(function(){
            $('.sidenav').sidenav();
          });
    }
    
    init();
});
