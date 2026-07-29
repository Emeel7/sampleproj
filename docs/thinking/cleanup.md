My current codebase is such a mess

I wanna clean things up

So far, a request goes through so many layers:
1. server.js 
2. middleware
3. routes

Now, in routes:
1. controllers
2. utils (for parsing controller received data)
3. models

and under models
1. exact type model, inherits from
2. base model

How can I clean this up?
Ofcourse, server.js and middleware must stay, and routes

Now, in routes for a specific request
1. Controllers use generic functions to parse incoming data from req.params or req.body or  req.query. These functions, however, are not all generic. For example, in /notes:
    - stripUndefinedFields
    - throwNonObjects
    - parseId (should be renamed: parseNoteId)
    - parseNoteData
    - parseNoteDataPartial
    - parseQuery (should be renamed: parseNoteFindAllQry)
From these, it is clear that only the first two are generic functions: the rest are specific to the note and its data' types
- Therefore, they should be encapsulated with note so that they may even be borrowed
- With this encapsulation comes branding

If I can find a way to do this, I can get rid of that abstract 'utils' layer 

2. Models. This part is quite the headache; a great mess
- There are two base models: 

    1. CollectionModel<T extends z.ZodObject> - provides the following methods
Constructor: db, collection (collection name), schema (zodSchema)
Methods:
    - (general)
        - findById
        - findAll
        - create
        - updateById
        - deleteById
    - (protected, only accessible by subclasses (why?))
        - (transaction methods)
            - txSet
            - txAdd
            - txUpdate
        - (non-transaction methods with WRITE access)
            - addItem
            - updateItem
        - (helper methods)
            - ref
            - format
            - schemaSafeParseOrThrow
            - getDocOrThrow

How this model works
- (general methods) 
    - accept data: unknown, and parse the data according to the schema
    - items such as: id, and (query for a findAll query)
        - id is taken as a generic string. Therefore whether it conforms to a certain string shape isn't really considered
        - qry - has a structure. the findAll method requires that the qry conforms to this structure
    - general methods exist because data received is assumed to be unknown
- (protected methods)
    - (transaction methods)
        - accept data conforming to T
    - (non-transaction WRITE)
        - accept data conforming to T
            - updateItem method accepts data that conforms to a custom type AtLeastOne<U> which enforces objects to contain at least one field to update
    - (helper methods)
        - ref() - has no parameters
        - format(d: DocSnapType) - generic function to format admin.firestore.DocumentSnapshot types to a simple object of {id, data}
        - schemaSafeParseOrThrow(data: unknown) - parses data to conform to schema (T)
        - getDocOrThrow(id: string) - gets document according to generic id

What then is the purpose of this model?
- Allows basic CRUD functionality for firestore collections
- Also allows other methods to extend this base model and utilise the protected methods for more versatile use

    2. LookupModel<T extends z.ZodObject>
- Works in a similar way to the above model

Okay so why did I write all of this?
I wanted to clean things up:

two types / kinds of data are received at the controller:
1. req.params / req.query data, and
2. req.body data

Both need to be parsed and identified (using zod), according to the model

Thinking: Layers:
1. Controllers (receive data: unknown)
2. Parsers layer? (parse data, throw appropriate errors)
3. Models (define business logic)
    - Actual models 
        - have certain schema; nominal & structural typing 
        - do they work with branded data? 
    - Base models 
        - provide DB access functionality
        - They receive data: unknown

