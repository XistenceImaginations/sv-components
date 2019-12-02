/**
 * Class used to manage event-handling.
 */
class Image {

    constructor(){
        this.pxRegex = /px/;
        this.percentRegex = /%/,
        this.urlRegex = /url\(['"]*(.*?)['"]*\)/g;
    }

    getCoverScale(imgBounds, viewBounds){
        let result = {
            scale: 1,
            width: 0,
            height: 0,
            xOffset: 0,
            yOffset: 0
        };

        result.scale = Math.max(
            viewBounds.width / imgBounds.width,
            viewBounds.height / imgBounds.height);
        result.width = parseInt(imgBounds.width * result.scale);
        result.height = parseInt(imgBounds.height * result.scale);
        result.xOffset = (viewBounds.width - result.width)/2;
        result.yOffset = (viewBounds.height - result.height)/2;

        return result;
    }
}

const imageUtil = new Image();

export default imageUtil;
