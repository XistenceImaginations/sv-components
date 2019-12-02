<template lang="pug">
    .svFlipPanel(class="{flipStyle}",on:click="{flip}")
        .svFlipPanel__content
            .svFlipPanel__content_front
                slot(name="front")
            .svFlipPanel__content_back
                slot(name="back")
</template>

<!--
  .xFlip(ref="flip")
    .xFlip__card
      .xFlip__card_front
        slot(name="front")
        .xFlip__shadow_front
      .xFlip__card_back
        slot(name="back")
        .xFlip__shadow_back
-->
<script>
    let flipped = false;

    $: flipStyle = flipped ? 'svFlipPanel--flipped' : '';

    function flip() {
        flipped = !flipped;
    }
</script>

<style lang="scss" global>
    @import '../App';

    .svFlipPanel {
        perspective: 1000px;
        width: 100%;
        height: 100%;

        &__content {
            width: 100%;
            height: 100%;
            transition: 0.6s;
            transform-style: preserve-3d;
            position: absolute;
            top: 0;
            left: 0;

            &_front,
            &_back {
                width: 100%;
                height: 100%;
                backface-visibility: hidden;
                position: absolute;
                top: 0;
                left: 0;
                //background-color: rgb(127, 127, 127);
            }
            &_front {
                z-index: 2;
                transform: rotateY(0deg);
            }
            &_back {
                transform: rotateY(180deg);
            }
        }

        &--flipped {
            .svFlipPanel__content {
                transform: rotateY(180deg);
            }
        }
    }
</style>
