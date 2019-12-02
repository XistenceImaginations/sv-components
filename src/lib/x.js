/**
 * Main class to access all functions and utils.
 */
import event     from './event';
import imageUtil from './image';

class X {

    // providing an instance of 'Event'
    get event(){
        return event;
    }

    get imageUtil() {
        return imageUtil;
    }
}

const x = new X();

export default x;