import BaseClass from './base.js'

class ChildClass extends BaseClass {
    constructor(collection: string) {
        super(collection)
    }

    override formatData() {
        return "yoghurt"
    }

    getDoctor() {
        return this.formatData()
    }
}

const myChild = new ChildClass('Kid')

const myChildsFavDrink = myChild.formatData()

const gotoSnack = myChildsFavDrink.concat(' and crisps')

const myChildsConfDrink = myChild.findById('')

const myDoctor = myChild.getDoctor()