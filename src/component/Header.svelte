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
        width: 100%;
        transition: background-color var(--animation-duration-slow),
                    box-shadow       var(--animation-duration-slow);
        box-shadow: none;
        z-index: $z-menu;
    }

    html:not([data-scroll='0']) {
        .svHeader {
            background-color: var(--bg-color);
            box-shadow: var(--box-shadow-dark);
        }
    }
</style>
