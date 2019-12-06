<template lang="pug">
    .svAccordion
        slot
</template>

<style lang="scss" global>
    @import '../App';

    .svAccordion {
        background: var(--primary-color);
        border: 1px solid var(--primary-color);
    }
</style>
