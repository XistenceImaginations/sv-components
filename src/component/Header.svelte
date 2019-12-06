<template lang="pug">
    .svHeader
        slot
</template>

<style lang="scss" global>
    @import '../App';

    .svHeader {
        position: sticky;
        left: 0;
        top: 0;
        z-index: 1;
        width: 100%;
    }
</style>
