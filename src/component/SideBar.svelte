<template lang="pug">
    .svSideBar
        slot
</template>

<script>
    /**
     * This is a listener for the global event, as theoretically there
     *  should only be one instance of Dialog. Practically there could be
     *  many, they might all be triggered then by this.
     */
    window.eventBus.bind('sv-sidebar', e => document.body.classList.toggle('--showSideBar'));

    /**
     * This defines a global method to trigger a dialog, as there should be only
     *  one dialog that is filled with information for the time being.
     */
    window.sidebar = window.sidebar || {};
    window.sidebar.show = e => {
        if (e.target){
            window.eventBus.dispatch('sv-sidebar');
        }
    };
</script>

<style lang="scss" global>
    @import '../App';

    // TODO z-index might need to be adapted (header is overlaying this)

    $svSideBarSize: 368px;

    .svSideBar {
        width: $svSideBarSize;
        position: fixed;
        left: -$svSideBarSize;
        top: 0;
        height: 100vh;
        background-color: var(--bg-color-dark);
        transition: left 250ms;
        padding: 0 1em;
    }

    .--showSideBar {
        margin-left: 368px;

        .svSideBar {
            left: 0;
        }
    }
</style>
