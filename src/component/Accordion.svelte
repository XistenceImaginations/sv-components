<template lang="pug">
    .svAccordion
        slot
</template>

<style lang="scss" global>
    @import '../App';

    .svAccordion {
        background: var(--bg-color);
        border: 1px solid var(--primary-color);
    }
</style>
