<template lang="pug">
    Page
        NavBar
            span(slot="title") Svelte Components Test Page
            div(slot="icons")
                IconBar
                    Icon(title='Facebook'  ,url="http://facebook.com"  ,icon="facebook")
                    Icon(title='Tumblr'    ,url="http://tumblr.com"    ,icon="tumblr")
                    Icon(title='Artstation',url="http://artstation.com",icon="help")
                    Icon(title='DeviantArt',url="http://deviantart.com",icon="deviantart")

        Title(size="3") Titles
        Section
            Title(size="1") Title Size 1
            Title(size="2") Title Size 2
            Title(size="3") Title Size 3
            Title(size="4") Title Size 4
            Title(size="5") Title Size 5
            Title(size="6") Title Size 6

        Title(size="2") Buttons
        Section
            Button(type="default") Default
            Button(type="default blinking") Default Blinking
            br
            br
            Button(type="primary") Primary
            Button(type="primary blinking") Primary Blinking
            br
            br
            Button(type="secondary") Secondary
            Button(type="secondary blinking") Secondary Blinking
            br
            br
            Button(type="disabled") Disabled
            Button(type="disabled blinking") Disabled Blinking

        Title(size="2") Checkboxes
        Section
            CheckBox Default unchecked
            CheckBox(checked) Default checked
            br
            CheckBox(disabled) Disabled unchecked
            CheckBox(disabled,checked) Disabled checked

        Title(size="2") Radios
        Section
            CheckBox(type="radio") Default unchecked
            CheckBox(type="radio",checked) Default checked
            br
            CheckBox(type="radio",disabled) Disabled unchecked
            CheckBox(type="radio",disabled,checked) Disabled checked

        Title(size="3") Grid
        Grid
            +each('images as image')
                Tile(width="{image.width}",height="{image.height}",gap="{gridGap}")
                    Image(url="{image.url}",focal="{image.focal}")
                    Overlay
                        Label {image.desc}
                        a(href="foo",style="pointer-events:all;")
                            Icon(icon="help")
            Tile(width="6",height="3",clip="{false}",gap="{gridGap}")
                FlipPanel
                    .wrapper(slot="front",style="box-shadow:0 10px 20px rgba(0,0,0,.25)")
                        Image(url="{images[0].url}",focal="{images[0].focal}")
                        Overlay
                            Label {images[0].desc}
                            a(href="foo",style="pointer-events:all;")
                                Icon(icon="help")
                    .wrapper(slot="back",style="padding:1em;")
                        Article(title="Image Title") Some image description.
            Tile(width="6",height="3",clip="{false}",gap="{gridGap}")
                FlipPanel
                    .wrapper(slot="front",style="box-shadow:0 10px 20px rgba(0,0,0,.25)")
                        Image(url="{images[1].url}",focal="{images[1].focal}")
                        Overlay
                            Label {images[1].desc}
                            a(href="foo",style="pointer-events:all;")
                                Icon(icon="help")
                    .wrapper(slot="back",style="padding:1em;")
                        Article(title="Image Title") Some image description.

        Title(size="2") Articles
        Section
            Article(title="First Article") Some article text.

        Title(size="2") Cards
        Section
            Card
                .wrapper(slot="image")
                    Image(url="{images[0].url}",focal="{images[0].focal}")
                span(slot="shortDesc") Short Description
                span(slot="longDesc") Long Description
            Card
                .wrapper(slot="image")
                    Image(url="{images[1].url}",focal="{images[1].focal}")
                span(slot="shortDesc") Short Description
                span(slot="longDesc") Long Description
            Card
                .wrapper(slot="image")
                    Image(url="{images[2].url}",focal="{images[2].focal}")
                span(slot="shortDesc") Short Description
                span(slot="longDesc") Long Description
</template>

<script>
    import Article   from './component/Article.svelte';
    import Button    from './component/Button.svelte';
    import Card      from './component/Card.svelte';
    import CheckBox  from './component/CheckBox.svelte';
    import FlipPanel from './component/FlipPanel.svelte';
    import Grid      from './component/Grid.svelte';
    import Icon      from './component/Icon.svelte';
    import IconBar   from './component/IconBar.svelte';
    import Image     from './component/Image.svelte';
    import Label     from './component/Label.svelte';
    import NavBar    from './component/NavBar.svelte';
    import Overlay   from './component/Overlay.svelte';
    import Page      from './component/Page.svelte';
    import Section   from './component/Section.svelte';
    import Tile      from './component/Tile.svelte';
    import Title     from './component/Title.svelte';

    let debug   = true;
    let gridGap = '.5em';
    // WARNING: images used here for testing are under my personal copyright. If you can load/see them, enjoy the view - but i guess if won't be even possible. Then you should replace the urls with any other image you like.
    let images  = [
        { focal: {y: 30}, desc: 'Crystal', width: 4, height: 2, url: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/389a4067-564a-4b24-a371-8799dc5d668e/ddkr6rp-baa0678d-d1cd-4acd-9c57-1b52473984dc.jpg/v1/fill/w_1132,h_706,q_70,strp/crystal_by_xistenceimaginations_ddkr6rp-pre.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9Nzk4IiwicGF0aCI6IlwvZlwvMzg5YTQwNjctNTY0YS00YjI0LWEzNzEtODc5OWRjNWQ2NjhlXC9kZGtyNnJwLWJhYTA2NzhkLWQxY2QtNGFjZC05YzU3LTFiNTI0NzM5ODRkYy5qcGciLCJ3aWR0aCI6Ijw9MTI4MCJ9XV0sImF1ZCI6WyJ1cm46c2VydmljZTppbWFnZS5vcGVyYXRpb25zIl19.GaBz4wCgIRZxYFnSc3cNhrrTnDNDy2YYUvWcsB-lRzg' },
        { desc: 'Project 138', width: 1, height: 2, url: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/389a4067-564a-4b24-a371-8799dc5d668e/ddkdpw2-7d2c202b-e322-474b-a8b1-cfd8ace25184.jpg/v1/fill/w_1280,h_2021,q_75,strp/project_138_by_xistenceimaginations_ddkdpw2-fullview.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MjAyMSIsInBhdGgiOiJcL2ZcLzM4OWE0MDY3LTU2NGEtNGIyNC1hMzcxLTg3OTlkYzVkNjY4ZVwvZGRrZHB3Mi03ZDJjMjAyYi1lMzIyLTQ3NGItYThiMS1jZmQ4YWNlMjUxODQuanBnIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.9OOsIOiBUvVKDZusMbV1YQB6X_qTWnkzVULBX6WFfc8' },
        { focal: {y: 230}, desc: 'Desc 3', width: 2, height: 2, url: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/389a4067-564a-4b24-a371-8799dc5d668e/ddk984l-7b153911-39c5-411d-9c55-d7ca0cf5a6e3.jpg/v1/fill/w_1280,h_2021,q_75,strp/quickpaint_12_11_2019_by_xistenceimaginations_ddk984l-fullview.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MjAyMSIsInBhdGgiOiJcL2ZcLzM4OWE0MDY3LTU2NGEtNGIyNC1hMzcxLTg3OTlkYzVkNjY4ZVwvZGRrOTg0bC03YjE1MzkxMS0zOWM1LTQxMWQtOWM1NS1kN2NhMGNmNWE2ZTMuanBnIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.e0c7TbVXfIVD7xkQcZdPS6_AM8XGrPHgCx41r0VM_p4' },
        { desc: 'Desc 4', width: 3, height: 2, url: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/389a4067-564a-4b24-a371-8799dc5d668e/ddjx64v-63cc51e4-b236-445c-b0b6-ddd9b90f10a4.jpg/v1/fill/w_1280,h_655,q_75,strp/planet_harvester_by_xistenceimaginations_ddjx64v-fullview.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9NjU1IiwicGF0aCI6IlwvZlwvMzg5YTQwNjctNTY0YS00YjI0LWEzNzEtODc5OWRjNWQ2NjhlXC9kZGp4NjR2LTYzY2M1MWU0LWIyMzYtNDQ1Yy1iMGI2LWRkZDliOTBmMTBhNC5qcGciLCJ3aWR0aCI6Ijw9MTI4MCJ9XV0sImF1ZCI6WyJ1cm46c2VydmljZTppbWFnZS5vcGVyYXRpb25zIl19.Gs8ku-E3xWamViEndAbEFpeNgeMsTzvSPJa8VcHWXQU' },
        { focal: {x: 130}, desc: 'Desc 5', width: 2, height: 2, url: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/389a4067-564a-4b24-a371-8799dc5d668e/ddjuz4h-dcd61e2d-5f50-4187-8a57-a005a3a4af8f.jpg/v1/fill/w_1280,h_634,q_75,strp/spirit_by_xistenceimaginations_ddjuz4h-fullview.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9NjM0IiwicGF0aCI6IlwvZlwvMzg5YTQwNjctNTY0YS00YjI0LWEzNzEtODc5OWRjNWQ2NjhlXC9kZGp1ejRoLWRjZDYxZTJkLTVmNTAtNDE4Ny04YTU3LWEwMDVhM2E0YWY4Zi5qcGciLCJ3aWR0aCI6Ijw9MTI4MCJ9XV0sImF1ZCI6WyJ1cm46c2VydmljZTppbWFnZS5vcGVyYXRpb25zIl19.4EF7Ph6zazjloFyoyq-Vm7AqVuU8MwHH1_03YPJWXCc' },
        { desc: 'Desc 6', width: 2, height: 3, url: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/389a4067-564a-4b24-a371-8799dc5d668e/ddjiuma-bed99f1b-a69c-42c6-a31c-6aed420974fd.jpg/v1/fill/w_861,h_929,q_70,strp/peace_by_xistenceimaginations_ddjiuma-pre.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTM4MSIsInBhdGgiOiJcL2ZcLzM4OWE0MDY3LTU2NGEtNGIyNC1hMzcxLTg3OTlkYzVkNjY4ZVwvZGRqaXVtYS1iZWQ5OWYxYi1hNjljLTQyYzYtYTMxYy02YWVkNDIwOTc0ZmQuanBnIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.7l6SOdshQsOJ8JdHs88gYXGin_YPUDXHD0MhF62SpFI' },
        { desc: 'Desc 7', width: 2, height: 3, url: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/389a4067-564a-4b24-a371-8799dc5d668e/ddjdsey-5697fd03-2aab-47d1-afbe-f6d0f36338fe.jpg/v1/fill/w_1280,h_1920,q_75,strp/scourier_by_xistenceimaginations_ddjdsey-fullview.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTkyMCIsInBhdGgiOiJcL2ZcLzM4OWE0MDY3LTU2NGEtNGIyNC1hMzcxLTg3OTlkYzVkNjY4ZVwvZGRqZHNleS01Njk3ZmQwMy0yYWFiLTQ3ZDEtYWZiZS1mNmQwZjM2MzM4ZmUuanBnIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.w2x9oAr9MDDHEao152zdYh6U60sfR6X5mpkPVsSS4JY' },
        { desc: 'Desc 8', width: 8, height: 3, url: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/389a4067-564a-4b24-a371-8799dc5d668e/ddj8zwv-40f9b550-4f99-4b62-9eac-f149b8bf3d99.jpg/v1/fill/w_932,h_858,q_70,strp/quickpaint_by_xistenceimaginations_ddj8zwv-pre.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTE3OCIsInBhdGgiOiJcL2ZcLzM4OWE0MDY3LTU2NGEtNGIyNC1hMzcxLTg3OTlkYzVkNjY4ZVwvZGRqOHp3di00MGY5YjU1MC00Zjk5LTRiNjItOWVhYy1mMTQ5YjhiZjNkOTkuanBnIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.uP9fXzUTLRVYCzgKG2Zrb8fGah2o1-5iEo841I9gxb0' }
    ];

    // TODO test for triggering a special mode by holding down CTRL and then clicking/selecting a 'component'
    function onClick (e) {
        if (e.ctrlKey) {
            alert('Special');
        }
    }
</script>

<style lang="scss" global>
    @import 'App';

    .wrapper {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
    }

    /* TODO put this into App.scss */
    :global(*) {
        box-sizing: border-box;
    }

    :global(body) {
        background-color: var(--bg-color);
        color: var(--text-color);
        margin: 0;
        padding: 0;
        font-family: var(--font-main);
        font-size: 16px;
        //font-size: calc(100vw / 64); /* TODO base = 1024px > 16px font-size; this can be used if everything should scale relative to browser width */
    }
</style>

<svelte:window on:click={onClick} />
