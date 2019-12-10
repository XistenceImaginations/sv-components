<!--
    Renders an image defined by an url. This image will fit into this components view,
    so this component must be used inside a container component to get a specific dimension
    for itself.
    Additionally you can define a 'focal'-point, a coordinate that is used to shift the image
    into a more optimized position, so you can see that part of the image that is intresting.
    If no focal point is defined the image will be rendered in 'cover'-mode, positioned centered 
    eiter horizontally and vertically.
-->
<template lang="pug">
    .svImage
        .svImage__view(style="background-image:url({url});",bind:this="{viewport}")
            slot
</template>

<script>
    import x from '../lib/x';

    export let focal;
    export let url = '';
    export let foo = undefined;

    let imageSize;
    let urlRegex = /url\(['"]*(.*?)['"]*\)/g;
    let viewport;

    function getImageSize () {
        return new Promise((resolve, reject) => {
            if (imageSize) {
                resolve(imageSize);
            } else {
                let img = new Image();

                img.onload = function() {
                    resolve(imageSize = { width: this.width, height: this.height });
                }
                img.src = viewport.style.backgroundImage.replace(urlRegex, '$1');
            }
        });
    }

    function updateFocal() {
        getImageSize ().then(imageSize => {
            let viewportBounds = viewport.getBoundingClientRect();

            if (viewportBounds && focal) {
                // TODO later we need to keep the focal in center of image, so an additional calculation for centering and then offsetting is needed
                let scale = Math.max(
                    viewportBounds.width / imageSize.width,
                    viewportBounds.height / imageSize.height
                );
                let scaledWidth = parseInt(imageSize.width * scale);
                let scaledHeight = parseInt(imageSize.height * scale);
                let newPos = [];
                let centerXOffset = (viewportBounds.width - scaledWidth) / 2;
                let centerYOffset = (viewportBounds.height - scaledHeight) / 2;

                if (focal.x !== undefined) {
                    let offsetX = -(focal.x * scale);

                    console.log('X>'+scaledWidth+'|'+offsetX+'|'+(scaledWidth + offsetX)+'|'+viewportBounds.width);
                    if (scaledWidth==viewportBounds.width||
                        scaledWidth + offsetX < viewportBounds.width) {
                        offsetX = centerXOffset;
                    }
                    // TODO limit @ opposite edge

                    newPos.push(offsetX + 'px');
                } else {
                    newPos.push(centerXOffset + 'px');
                }
                if (focal.y !== undefined) {
                    let offsetY = -(focal.y * scale);

                    console.log('Y>'+scaledHeight+'|'+offsetY+'|'+(scaledHeight + offsetY)+'|'+viewportBounds.height);
                    if (scaledHeight==viewportBounds.height||
                        scaledHeight + offsetY < viewportBounds.height) {
                        offsetY = centerYOffset;
                    }
                    // TODO limit @ opposite edge

                    newPos.push(offsetY + 'px');
                } else {
                    newPos.push(centerYOffset + 'px');
                }
                viewport.style.backgroundPosition = newPos.join(' ');
            }
        });
    }

    x.event.isReady(updateFocal);
</script>

<style lang="scss" global>
    @import '../App';

    .svTile.hovered .svImage__view{ // TODO HACK, as events and props aren't sufficient as far as it can be seen for now
        /* TODO this scale the content, target is to just scale background-image. As it is placed by 'cover' this isn't easy via CSS for now*/
        transform: scale(1.025);
    }

    .svImage {
        width: 100%;
        height: 100%;
        position: relative;
        overflow: hidden;
        box-shadow: var(--box-shadow-dark);

        &__view {
            width: 100%;
            height: 100%;
            background-repeat: no-repeat;
            background-size: cover;
            background-position: 50% 50%;
            overflow: hidden;
            position: relative;
            transition: transform var(--animation-duration);

            &:hover {
                /* TODO this scale the content, target is to just scale background-image. As it is placed by 'cover' this isn't easy via CSS for now*/
                transform: scale(1.025);
            }
        }
    }

    :global(body.debug) {
        & .svImage__view {
            background-color: var(--debug-color);
        }
    }
</style>

<svelte:window on:resize="{updateFocal}"/>