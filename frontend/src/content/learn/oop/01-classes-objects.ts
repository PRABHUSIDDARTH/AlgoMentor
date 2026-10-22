import type { Lesson } from '../types'

const lesson: Lesson = {
  id: 'classes-objects',
  title: 'Classes & objects',
  minutes: 8,
  diagram: 'class-object',
  body: `## A class is a blueprint

A **class** describes a kind of thing: the data each one holds (its *fields*) and what it can do (its *methods*). An **object** is one concrete thing made from that blueprint, with its own field values.

A library has thousands of books. You don't write code for each book. You write one \`Book\` class and make as many \`Book\` objects as you need. The class is written once, at design time; objects are created while the program runs, as many as the data calls for.

## Fields hold state, methods hold behaviour

Every object carries its own copy of the fields. Changing \`book1.title\` doesn't touch \`book2.title\`. Methods are shared: there is one \`borrow()\` method, and it works on whichever object you call it on. Inside the method, \`this\` (Java, C++) or \`self\` (Python) is that object.

That split is the heart of object-oriented design. The data that describes one book and the rules for changing it live side by side. Code elsewhere asks the book to do something (\`book.borrow()\`) instead of reaching in and flipping a flag itself.

## Constructors set up a valid object

A **constructor** runs when an object is created. Its job is to leave the object in a usable state, so it should take everything the object can't work without. A book without an ISBN is a bug waiting to happen, so the constructor asks for it.

Good constructors check their arguments and refuse bad ones early. If a title can't be empty, throw an error in the constructor rather than discovering the empty title three screens later. Fields that never change after construction can be marked \`final\` (Java) or \`const\` (C++), which documents the intent and lets the compiler hold you to it.

## Instance members and class members

Most fields and methods belong to each object: they are **instance members**. Sometimes a value belongs to the class as a whole, such as a counter of how many books exist or a constant like the maximum loan period. Those are **static** (class) members. There is exactly one copy, shared by every object, and you can use it without creating an object at all.

Use static members sparingly. Shared mutable state is hard to test and easy to corrupt from two places at once, which is why most static fields in real code are constants.

## Objects have identity

Two objects can hold identical values and still be different objects. \`new Book("Dune", "978-0441")\` called twice gives two books that are *equal* in content but not the *same* object: borrowing one doesn't borrow the other. Languages separate the two questions: Java has \`==\` (same object) and \`equals()\` (same value); Python has \`is\` and \`==\`. Knowing which one you mean avoids a whole family of bugs.

## How to think about it in practice

When you start a design, read the problem statement and underline the nouns: member, book, loan, fine. Those are candidate classes. The verbs (borrow, return, renew) become methods on the class that owns the data the verb changes. You will refine this list, but it is a reliable first step and it is exactly how interviewers expect you to begin.`,
  code: {
    java: `public class Book {
    private static int created = 0;

    private final String title;
    private final String isbn;
    private boolean onLoan;

    public Book(String title, String isbn) {
        if (title == null || title.isBlank()) throw new IllegalArgumentException("title is required");
        if (isbn == null || isbn.isBlank()) throw new IllegalArgumentException("isbn is required");
        this.title = title;
        this.isbn = isbn;
        created++;
    }

    public void borrow() {
        if (onLoan) throw new IllegalStateException(title + " is already on loan");
        onLoan = true;
    }

    public String isbn() {
        return isbn;
    }

    public static int created() {
        return created;
    }
}`,
    python: `class Book:
    created = 0  # class attribute: one copy shared by every Book

    def __init__(self, title: str, isbn: str) -> None:
        if not title or not isbn:
            raise ValueError("title and isbn are required")
        self.title = title
        self.isbn = isbn
        self.on_loan = False
        Book.created += 1

    def borrow(self) -> None:
        if self.on_loan:
            raise ValueError(f"{self.title} is already on loan")
        self.on_loan = True


a = Book("Dune", "978-0441")
b = Book("Dune", "978-0441")
print(a is b, Book.created)  # False 2`,
    cpp: `#include <stdexcept>
#include <string>
#include <utility>

class Book {
public:
    Book(std::string title, std::string isbn) : title_(std::move(title)), isbn_(std::move(isbn)) {
        if (title_.empty() || isbn_.empty()) throw std::invalid_argument("title and isbn are required");
        ++created_;
    }

    void borrow() {
        if (onLoan_) throw std::logic_error(title_ + " is already on loan");
        onLoan_ = true;
    }

    const std::string& isbn() const { return isbn_; }
    static int created() { return created_; }

private:
    inline static int created_ = 0;
    std::string title_;
    std::string isbn_;
    bool onLoan_ = false;
};`,
  },
  quiz: [
    { id: 'co-1', prompt: 'What is the relationship between a class and an object?', options: ['They are two names for the same thing', 'A class is a blueprint; an object is one instance made from it', 'An object is a blueprint; a class is an instance', 'A class is a running program; an object is its source code'], answer: 1, why: 'The class defines fields and methods once; each object is a separate instance with its own field values.' },
    { id: 'co-2', prompt: 'Two Book objects are created and book1.title is changed. What happens to book2.title?', options: ['It changes too', 'It becomes null', 'Nothing: each object has its own copy of instance fields', 'The program fails to compile'], answer: 2, why: 'Instance fields belong to each object separately. Only static (class) fields are shared by all instances.' },
    { id: 'co-3', prompt: 'What should a constructor guarantee?', options: ['That the object is in a valid, usable state', 'That the object is saved to a database', 'That every method has been called once', 'That the class has no fields'], answer: 0, why: 'A constructor sets up the rules an object depends on, for example a Book always having an ISBN.' },
    { id: 'co-4', prompt: 'A static field such as Book.created is:', options: ['Copied into every object', 'Shared by the class: one copy for all objects', 'Only visible inside the constructor', 'Reset each time an object is created'], answer: 1, why: 'Static (class) members exist once per class, not once per object.' },
    { id: 'co-5', prompt: 'In Java, two Book objects hold identical titles and ISBNs. What does a == b compare?', options: ['Whether their fields are equal', 'Whether they are the same object in memory', 'Whether they belong to the same class', 'Their hash codes'], answer: 1, why: '== on references checks identity; equals() is where value equality is defined.' },
  ],
  interview: [
    { q: 'What is the difference between a class and an object?', a: 'A class is a type definition: the fields and methods a kind of thing has. An object is a runtime instance of that class with its own field values. One class, many objects.' },
    { q: 'Why make a constructor require arguments instead of providing setters?', a: 'So an object can never exist in an invalid half-built state. Required data goes in the constructor, the object is valid from the moment it exists, and those fields can be final or const.' },
    { q: 'What is the difference between identity and equality?', a: 'Identity asks whether two references point at the same object (== in Java, is in Python). Equality asks whether two objects represent the same value, which the class defines (equals/hashCode in Java, __eq__ in Python).' },
  ],
}

export default lesson
