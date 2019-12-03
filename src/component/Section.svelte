<!--
    A simple title element.
-->
<template lang="pug">
    .svSection
        slot
</template>

<style lang="scss" global>
    @import '../App';

    .svSection {
        font-size: 1rem;
        padding-left: 1.5rem;
        margin-bottom: 4rem;

        & .svSection {
            margin-bottom: 2rem;
        }
    }
</style>
