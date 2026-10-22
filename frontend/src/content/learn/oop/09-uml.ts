import type { Lesson } from '../types'

const lesson: Lesson = {
  id: 'uml',
  title: 'UML class diagrams',
  minutes: 8,
  diagram: 'uml-notation',
  body: `## A picture of the design

A **UML class diagram** shows the classes in a design, what each one holds and does, and how they relate. You won't draw full UML at work very often, but a quick class diagram on a whiteboard is the fastest way to agree on a design, and low-level design interviews expect you to sketch one.

## Drawing a class

Each class is a box with three compartments:

1. the **name** (italic or marked \`<<abstract>>\` for abstract classes, \`<<interface>>\` for interfaces),
2. the **attributes**: \`- balance: long\`,
3. the **operations**: \`+ withdraw(cents: long): void\`.

The symbol in front is the visibility: \`+\` public, \`-\` private, \`#\` protected, \`~\` package. Static members are underlined. You can leave out compartments that don't matter for the conversation; a box with only a name is fine on a whiteboard.

## The six relationships

The lines between boxes carry most of the meaning, so learn them precisely:

- **Inheritance (generalisation):** solid line with a hollow triangle pointing at the parent. \`EBook\` to \`LibraryItem\`.
- **Realisation:** dashed line with a hollow triangle pointing at the interface. \`EmailChannel\` to \`Channel\`.
- **Association:** a plain solid line. A \`Member\` borrows \`Books\`; an arrowhead shows which side knows about the other.
- **Aggregation:** solid line with a hollow diamond at the whole. A \`Team\` has \`Players\` who exist without it.
- **Composition:** solid line with a filled diamond at the whole. A \`House\` has \`Rooms\` that die with it.
- **Dependency:** dashed line with an open arrow. A class uses another briefly, for example as a method parameter.

## Multiplicity

Numbers at the ends of an association say how many objects take part: \`1\`, \`0..1\`, \`*\` (zero or more), \`1..*\` (at least one). "A \`Member\` has \`0..5\` active \`Loans\`; each \`Loan\` belongs to exactly \`1\` \`Member\`" is a business rule the diagram makes explicit, and a good prompt for a clarifying question in an interview.

## From diagram to code

Each relationship has a usual translation:

- inheritance becomes \`extends\`, realisation becomes \`implements\`;
- association and aggregation become a field holding a reference (or a collection for \`*\`);
- composition becomes a field the whole creates and owns (in C++, often a member value or \`unique_ptr\`);
- dependency becomes a parameter or local variable, not a field.

Going the other way, reading a codebase and sketching its class diagram, is a fast way to understand unfamiliar code.

## Keep diagrams honest and small

A diagram with forty classes communicates nothing. Draw the five to ten classes that matter for the question at hand, show only the attributes and methods that explain the design, and label associations with verbs ("borrows", "parks in"). If the diagram and the code disagree, the code wins, so treat diagrams as a thinking tool for a conversation, not documentation to maintain forever.

UML also has sequence diagrams (who calls whom, in what order), which are worth knowing for explaining flows such as "a car enters the parking lot".`,
  code: {
    java: `import java.util.ArrayList;
import java.util.List;

// LibraryItem <|-- Book            (inheritance)
// Member "1" -- "0..5" Loan        (association with multiplicity)
// Library *-- Shelf                (composition: shelves die with the library)
public abstract class LibraryItem {
    protected final String title;

    protected LibraryItem(String title) {
        this.title = title;
    }
}

class Book extends LibraryItem {
    Book(String title) {
        super(title);
    }
}

class Loan {
    final Book book;

    Loan(Book book) {
        this.book = book;
    }
}

class Member {
    private static final int MAX_LOANS = 5;
    private final List<Loan> loans = new ArrayList<>();

    void borrow(Book book) {
        if (loans.size() == MAX_LOANS) throw new IllegalStateException("loan limit reached");
        loans.add(new Loan(book));
    }
}

class Shelf {
}

class Library {
    private final List<Shelf> shelves = new ArrayList<>();

    Library(int shelfCount) {
        for (int i = 0; i < shelfCount; i++) shelves.add(new Shelf()); // created and owned here
    }
}`,
    python: `from dataclasses import dataclass, field


class LibraryItem:
    def __init__(self, title: str) -> None:
        self.title = title


class Book(LibraryItem):  # LibraryItem <|-- Book
    pass


@dataclass
class Loan:
    book: Book


@dataclass
class Member:  # Member "1" -- "0..5" Loan
    MAX_LOANS = 5
    loans: list[Loan] = field(default_factory=list)

    def borrow(self, book: Book) -> None:
        if len(self.loans) == self.MAX_LOANS:
            raise ValueError("loan limit reached")
        self.loans.append(Loan(book))


class Library:  # Library *-- Shelf (composition)
    def __init__(self, shelf_count: int) -> None:
        self._shelves = [object() for _ in range(shelf_count)]`,
    cpp: `#include <memory>
#include <stdexcept>
#include <string>
#include <vector>

class LibraryItem {
public:
    explicit LibraryItem(std::string title) : title_(std::move(title)) {}
    virtual ~LibraryItem() = default;

protected:
    std::string title_;
};

class Book : public LibraryItem {  // inheritance
public:
    using LibraryItem::LibraryItem;
};

struct Loan {
    const Book* book;  // association: refers to a book it does not own
};

class Member {
public:
    void borrow(const Book& book) {
        if (loans_.size() == kMaxLoans) throw std::logic_error("loan limit reached");
        loans_.push_back(Loan{&book});
    }

private:
    static constexpr std::size_t kMaxLoans = 5;
    std::vector<Loan> loans_;
};

class Shelf {};

class Library {
public:
    explicit Library(int shelfCount) : shelves_(shelfCount) {}  // composition: owned by value

private:
    std::vector<Shelf> shelves_;
};`,
  },
  quiz: [
    { id: 'um-1', prompt: 'In a UML class box, what does - in front of an attribute mean?', options: ['Public', 'Private', 'Protected', 'Static'], answer: 1, why: '+ public, - private, # protected, ~ package; static members are underlined.' },
    { id: 'um-2', prompt: 'A dashed line with a hollow triangle pointing at Channel means:', options: ['Realisation: the class implements the Channel interface', 'Inheritance from a class', 'Composition', 'Dependency'], answer: 0, why: 'Solid line + hollow triangle is inheritance; dashed line + hollow triangle is realisation of an interface.' },
    { id: 'um-3', prompt: 'A House and its Rooms (rooms cannot exist without the house) are drawn with:', options: ['A hollow diamond at House', 'A hollow triangle', 'A dashed arrow', 'A filled diamond at House'], answer: 3, why: 'Composition, the strong ownership relationship, uses a filled diamond at the whole.' },
    { id: 'um-4', prompt: 'Multiplicity 1..* at one end of an association means:', options: ['Exactly one', 'Zero or one', 'At least one', 'Zero or more'], answer: 2, why: '1..* is one or more; * alone means zero or more.' },
    { id: 'um-5', prompt: 'A class uses another only as a method parameter. Which relationship is that?', options: ['Composition', 'Dependency', 'Aggregation', 'Inheritance'], answer: 1, why: 'Dependency (dashed arrow) is a short-lived "uses" relationship, not a field.' },
  ],
  interview: [
    { q: 'What is the difference between association, aggregation and composition?', a: 'Association: objects know about each other. Aggregation: a whole holds parts that can exist independently (hollow diamond). Composition: the whole owns parts whose lifetime it controls (filled diamond).' },
    { q: 'How do you use UML in a low-level design interview?', a: 'Sketch the five to ten core classes with key attributes and methods, draw relationships with multiplicities, and talk through them. Use it to agree on the model before writing code, not as exhaustive documentation.' },
  ],
}

export default lesson
