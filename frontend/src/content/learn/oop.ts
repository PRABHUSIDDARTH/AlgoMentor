import type { Track } from './types'

export const OOP: Track = {
  id: 'oop',
  title: 'Object-oriented programming',
  short: 'OOP',
  summary: 'Model programs as objects that own their data and behaviour, then design them so they stay easy to change.',
  projects: [],
  modules: [
    {
      id: 'classes-objects',
      title: 'Classes & objects',
      minutes: 8,
      diagram: 'class-object',
      body: `## A class is a blueprint

A **class** describes a kind of thing: the data each one holds (its *fields*) and what it can do (its *methods*). An **object** is one concrete thing made from that blueprint, with its own field values.

A library has thousands of books. You don't write code for each book. You write one \`Book\` class and make as many \`Book\` objects as you need.

## Fields hold state, methods hold behaviour

Every object carries its own copy of the fields. Changing \`book1.title\` doesn't touch \`book2.title\`. Methods are shared: there is one \`borrow()\` method, and it works on whichever object you call it on. Inside the method, \`this\` (Java, C++) or \`self\` (Python) is that object.

## Constructors set up a valid object

A **constructor** runs when an object is created. Its job is to leave the object in a usable state, so it should take everything the object can't work without. A book without an ISBN is a bug waiting to happen, so the constructor asks for it.`,
      code: {
        java: `public class Book {
    private final String title;
    private final String isbn;
    private boolean onLoan;

    public Book(String title, String isbn) {
        this.title = title;
        this.isbn = isbn;
    }

    public void borrow() {
        if (onLoan) throw new IllegalStateException(title + " is already on loan");
        onLoan = true;
    }
}`,
        python: `class Book:
    def __init__(self, title: str, isbn: str) -> None:
        self.title = title
        self.isbn = isbn
        self.on_loan = False

    def borrow(self) -> None:
        if self.on_loan:
            raise ValueError(f"{self.title} is already on loan")
        self.on_loan = True`,
        cpp: `#include <stdexcept>
#include <string>

class Book {
public:
    Book(std::string title, std::string isbn) : title_(std::move(title)), isbn_(std::move(isbn)) {}

    void borrow() {
        if (onLoan_) throw std::logic_error(title_ + " is already on loan");
        onLoan_ = true;
    }

private:
    std::string title_;
    std::string isbn_;
    bool onLoan_ = false;
};`,
      },
      quiz: [
        { id: 'co-1', prompt: 'What is the relationship between a class and an object?', options: ['They are two names for the same thing', 'A class is a blueprint; an object is one instance made from it', 'An object is a blueprint; a class is an instance', 'A class is a running program; an object is its source code'], answer: 1, why: 'The class defines fields and methods once; each object is a separate instance with its own field values.' },
        { id: 'co-2', prompt: 'Two Book objects are created and book1.title is changed. What happens to book2.title?', options: ['It changes too', 'It becomes null', 'Nothing: each object has its own copy of instance fields', 'The program fails to compile'], answer: 2, why: 'Instance fields belong to each object separately. Only static fields are shared by all instances.' },
        { id: 'co-3', prompt: 'What should a constructor guarantee?', options: ['That the object is in a valid, usable state', 'That the object is saved to a database', 'That every method has been called once', 'That the class has no fields'], answer: 0, why: 'A constructor sets up the invariants an object needs, for example a Book always having an ISBN.' },
        { id: 'co-4', prompt: 'Inside a method, what does this (Java/C++) or self (Python) refer to?', options: ['The class itself', 'The object the method was called on', 'The first argument passed by the caller', 'The parent class'], answer: 1, why: 'Calling book1.borrow() runs borrow with this/self bound to book1.' },
        { id: 'co-5', prompt: 'How many copies of the borrow() method exist when you create 1,000 Book objects?', options: ['1,000', 'One per field', 'One, shared by all objects', 'None until borrow() is first called'], answer: 2, why: 'Methods are defined once on the class; objects share them and differ only in their field values.' },
      ],
      interview: [
        { q: 'What is the difference between a class and an object?', a: 'A class is a type definition: the fields and methods a kind of thing has. An object is a runtime instance of that class with its own field values. One class, many objects.' },
        { q: 'Why would you make a constructor require arguments instead of providing setters?', a: 'So an object can never exist in an invalid half-built state. Required data goes in the constructor; the object is valid from the moment it exists, and fields can be final/immutable.' },
      ],
    },
    {
      id: 'encapsulation',
      title: 'Encapsulation',
      minutes: 7,
      body: `## Hide the data, expose the behaviour

**Encapsulation** means an object keeps its fields private and lets the outside world change them only through methods that protect its rules.

If \`balance\` on a bank account is public, any code anywhere can set it to minus a million. If it is private and changed only through \`deposit()\` and \`withdraw()\`, the account can refuse an overdraft in one place.

## Getters and setters are not automatically encapsulation

A private field with a public setter for every field is still an open door. Prefer methods named after what the object *does* (\`withdraw\`) over methods that just poke its data (\`setBalance\`).`,
      quiz: [
        { id: 'en-1', prompt: 'What is the main goal of encapsulation?', options: ['Making code run faster', 'Letting an object protect its own rules by controlling access to its data', 'Avoiding the use of classes', 'Sharing fields between all objects'], answer: 1, why: 'Private data plus behaviour-revealing methods means invariants are enforced in one place.' },
        { id: 'en-2', prompt: 'A class has private fields and a public setter for every field. Is it well encapsulated?', options: ['Yes, the fields are private', 'Not really: any caller can still put it into any state', 'Yes, setters are always safe', 'Only if it also has getters'], answer: 1, why: 'Unrestricted setters expose the state just as much as public fields do.' },
        { id: 'en-3', prompt: 'Which method best fits an encapsulated BankAccount?', options: ['setBalance(int)', 'withdraw(int amount)', 'getBalanceField()', 'balanceRef()'], answer: 1, why: 'withdraw names a behaviour and can check the rule (no overdraft) before changing state.' },
        { id: 'en-4', prompt: 'Which Java access modifier keeps a field visible only inside its own class?', options: ['public', 'protected', 'private', 'default (package)'], answer: 2, why: 'private restricts access to the declaring class.' },
        { id: 'en-5', prompt: 'Why does encapsulation make code easier to change?', options: ['Callers depend on behaviour, so the internal representation can change freely', 'It removes the need for tests', 'It makes every class immutable', 'It forbids inheritance'], answer: 0, why: 'If nobody touches the fields directly, you can swap their representation without breaking callers.' },
      ],
      interview: [
        { q: 'Explain encapsulation with an example.', a: 'A BankAccount keeps balance private and exposes deposit and withdraw. withdraw refuses to overdraw, so the rule lives in one place and no caller can bypass it.' },
        { q: 'Are getters and setters encapsulation?', a: 'Only partly. They hide the field name, but a setter for every field lets callers set any state. Good encapsulation exposes behaviour that keeps the object valid.' },
      ],
    },
  ],
}
