<template lang="pug">
    .svWiperPage(bind:this="{elm}")
        slot
</template>

<script>
    let elm;

    window.eventBus.bind('sv-swiper', e => {
        let swiper = elm.closest('.svWiper');

        if (swiper) {
            let pages = swiper.querySelectorAll('.svWiper__content > .svWiperPage');
            let index = -1,
                i = 0;
            let top = swiper.scrollTop;
            let height = swiper.getBoundingClientRect().height;

            // Lookup to get the index of this child relative to its parent/siblings
            pages.forEach(e => { index = index === -1 && elm === e ? i : index; i++; });

            if (index !== -1) {
                let start = height * index; // Upper edge of a layer (absolute to its parent)
                let visibility = (start - top/*upper edge of a layer (relative)*/) / height;

                // This is for calculating the visibility of layer. Usually we could only see
                //  two layers at the same time, for both we want to have a precentage-value
                //  of visiblity. Therefore we have to declare a 'range' where we see that it
                //  visible at all or not.
                if (visibility > -1 && visibility <= 1) {
                    // TODO maybe fade layer out when it is in/above upper half, below keep it at opacity === 1
                    elm.style.opacity = visibility < 0 ? 1 + visibility : 1;
                }

                // The z-index is important, because the latest element lies on top
                //  but we want to have the first element there. Flex and other tricks
                //  aren't sufficient here, so we set the z-order manually to re-order
                //  the layers.
                elm.style.zIndex = pages.length - index;

                // We don't want to have the layers scrolled as long their 'virtual'
                // position is above the current scrolling position.
                elm.style.top = (start > top ? top : start) + 'px';
            }
        }
    });
</script>

<style lang="scss" global>
    @import '../App';

    .svWiperPage {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
    }
</style>
