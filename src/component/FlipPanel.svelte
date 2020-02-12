<template lang="pug">
    .svFlipPanel(class="{flipState} {flipStyle}",on:click="{flip}")
        .svFlipPanel__content
            .svFlipPanel__content_front
                slot(name="front")
            .svFlipPanel__content_back
                slot(name="back")
</template>

<script>
    import { createEventDispatcher } from 'svelte';

    export let horizontal;

    const dispatch = createEventDispatcher();
    let flipped = false;

    // TODO option to provide an element that flips back the panel (instead of flipping back by clicking the panel itself)

    $: flipStyle = (horizontal !== undefined ? 'svFlipPanel--horizontal' : 'svFlipPanel--vertical');
    $: flipState = (flipped ? 'svFlipPanel--flipped' : '');

    function flip() {
        flipped = !flipped;
        dispatch('flip', {
            state: flipped
        });
    }
</script>

<style lang="scss" global>
    @import '../App';

    // TODO when in flip-animation: bring to front with z-index (maybe) otherwise some elements might overlapping flipped content, 'destroying' the visual immersion
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
            }
            &_front {
                z-index: 2;
            }
        }
    }

    .svFlipPanel--horizontal {
        .svFlipPanel {
            &__content {
                &_front {
                    transform: rotateX(0deg);
                }
                &_back {
                    transform: rotateX(180deg);
                }
            }
        }

        &.svFlipPanel--flipped {
            .svFlipPanel__content {
                transform: rotateX(180deg);
            }
        }
    }


    .svFlipPanel--vertical {
        .svFlipPanel {
            &__content {
                &_front {
                    transform: rotateY(0deg);
                }
                &_back {
                    transform: rotateY(180deg);
                }
            }
        }
        &.svFlipPanel--flipped {
            .svFlipPanel__content {
                transform: rotateY(180deg);
            }
        }
    }
</style>
