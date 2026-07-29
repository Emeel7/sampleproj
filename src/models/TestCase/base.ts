export default class BaseClass {
    constructor(
        private collection: string
    ) {

    }

    protected formatData(): string | number {
        return 15
    }

    findById(id: string) {
        return this.formatData()
    }
}