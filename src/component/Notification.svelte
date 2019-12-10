<template lang="pug">
    .svNotification(bind:this="{elm}",class:svNotification--visible="{isShown}",class="{styleType}",class="{notificationType}")
        .svNotification__icon(class="{iconStyle}")
        .svNotification__content
            .svNotification__content_title
                .svNotification__content_title_text {title}
                .svNotification__content_title_close(class:svNotification__content_title_close--visible="{(close === 'click')}",on:click="{hide}")
                    i.icon-cancel
            .svNotification__content_text {text}
</template>

<script>
    // TODO Dialog, and Notifaction have a lot in common, create sort of abstract base component to extend from
    // TODO allow to define content for notification that isn't just text alone. it should support full HTML, but then
    //  we need to have a simple way to define it via slot or similar
    export let type      = undefined;
    export let close     = undefined;
    export let floatable = undefined;

    let elm;
    let title   = 'N/A';
    let text    = 'N/A';
    let icon    = 'cancel';
    let isShown = false;
    let iconMap = {
        'error'  : 'cancel',
        'success': 'check',
        'info'   : 'info',
        'confirm': 'help'
    };
    let timer;

    $: iconStyle        = type && iconMap[type] ? 'icon-' + iconMap[type] : undefined;
    $: styleType        = type ? 'svNotification--' + type : undefined;
    $: notificationType = floatable  ? 'svNotification--floatable' : undefined;
    $: isFloatable      = floatable === true;

    /**
     * This is a listener for the global event, as theoretically there
     *  should only be one instance of Notification of each shaping (badge/floatable).
     * Practically there could be many, they might all be triggered then by this.
     */
    window.eventBus.bind('sv-notification', e => {
        if (isFloatable == e.detail.floatable) {
            title   = e.detail.title || 'N/A';
            text    = e.detail.text || 'N/A';
            type    = e.detail.type || undefined;
            isShown = true;

            if (close !== 'click') {
                let time = /([\d\.]+)(s|ms)/.exec(close);

                if (time && time[1] && time[2]) {
                    if (timer) {
                        clearTimeout(timer);
                    }
                    timer = setTimeout(() => isShown = false, Math.ceil(
                        parseFloat(time[1]) * (time[2] === 's' ? 1000 : 1)));
                }
            }
        }
    });

    /**
     * This defines a global method to trigger a notification.
     */
    window.notification = window.notification || {};
    window.notification.show = e => {
        if (e.target){
            window.eventBus.dispatch('sv-notification', {
                title    : e.target.dataset.title,
                text     : e.target.dataset.text,
                type     : e.target.dataset.type,
                floatable: e.target.dataset.floatable !== undefined});
        }
    };

    function hide () {
        isShown = false;
    }
</script>

<style lang="scss" global>
    @import '../App';

    .svNotification {
        background-color: transparent;
        color: white; // TODO do we need to define a specific text-color in the scheme. or different scheme colors for used notification-color-variations? -> var(--fg-color);
        width: 100%;
        height: 0;
        margin: 0;
        opacity: 0;
        transition: height  var(--animation-duration),
                    opacity var(--animation-duration);
        overflow: hidden;
        display: flex;
        border-top: 1px solid transparent;
        border-bottom: 1px solid transparent;

        &__icon {
            flex-grow: 0;
            font-size: 3em;
            min-width: 1em;
            padding-top: .25em;
        }

        &__content {
            flex-grow: 1;
            display: flex;
            flex-direction: column;

            &_title {
                flex-grow: 0;
                padding-left: .5em;
                padding-right: 1em;
                font-size: 1.25em;
                font-weight: bolder;
                display: flex;

                &_text {
                    flex-grow: 1;
                }

                &_close {
                    flex-grow: 0;
                    display: none;

                    &--visible {
                        display: inline-block;
                    }
                }
            }

            &_text {
                flex-grow: 1;
                padding-left: 1em;
            }
        }

        &--floatable {
            position: absolute;
            right: 10px;
            //top: 10px;
            margin-top: 10px;
            width: 320px;
            border: 1px solid transparent;
            box-shadow: var(--box-shadow-dark);
            border-radius: 4px;
        }

        &--visible {
            height: 80px;
            opacity: 1;
        }

        // TODO use x.js/shaping for this
        &--info {
            background-color: var(--primary-color-darker);
            border-color: var(--primary-color);
        }

        &--confirm {
            background-color: var(--secondary-color-darker);
            border-color: var(--secondary-color);
        }

        &--error {
            background-color: var(--negative-color-darker);
            border-color: var(--negative-color);
        }

        &--success {
            background-color: var(--positive-color-darker);
            border-color: var(--positive-color);
        }
    }
</style>
