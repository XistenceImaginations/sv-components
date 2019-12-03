<template lang="pug">
    .svButtonGroup
        slot
</template>

<style lang="scss" global>
    @import '../App';

    /* TODO to achieve: a flex grid where we can force to wrap at each n-th direct child,
        w/o touch the CSS of the child directly/massively */
    .svButtonGroup {
        display: flex;
        flex-wrap: wrap;
        position: relative;
        align-content: space-between;

        & > * {
            flex-grow: 1;
        }

        /* TODO later '4n' should be sort of component property */
        & > *:nth-child(4n) {
            flex-basis: 100%;
        }
    }
</style>
