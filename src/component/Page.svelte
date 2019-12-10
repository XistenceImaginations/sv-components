<!--
    Component for render the page. We should set up basic layout definitions here.
-->
<template lang="pug">
    .svPage
        slot
</template>

<style lang="scss" global>
    @import '../App';

    .svPage {
        padding-left: 5rem; // TODO use Page to set up the basic layout for page content. make this configurable
        padding-right: 2rem; // TODO use Page to set up the basic layout for page content. make this configurable
    }
</style>
