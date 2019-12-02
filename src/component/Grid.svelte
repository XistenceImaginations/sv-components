<template lang="pug">
    .svGrid
        slot
</template>

<style lang="scss" global>
    .svGrid {
        display: flex;
        flex-wrap: wrap;
        margin-bottom: 16px; // TODO use em
    }

    :global(.svGrid) {
        & .svTile {
            padding: 0em; // TODO
        }
    }

    :global(body.debug) {
        & .svGrid {
            background-color: var(--debug-color);
        }
    }
</style>
