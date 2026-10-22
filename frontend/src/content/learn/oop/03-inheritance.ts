import type { Lesson } from '../types'

const lesson: Lesson = {
  id: 'inheritance',
  title: 'Inheritance',
  minutes: 9,
  diagram: 'inheritance-tree',
  body: `## "Is a" relationships

**Inheritance** lets one class (the *subclass* or *child*) build on another (the *superclass* or *parent*). The child gets the parent's fields and methods and can add its own or change how some of them work.

Use it when the child truly **is a** kind of the parent. A \`Car\` is a \`Vehicle\`; an \`EBook\` is a \`LibraryItem\`. If you find yourself saying "has a" instead (a car *has an* engine), you want composition, which a later module covers.

## What the child gets

A subclass inherits every non-private member of its parent. It can:

- **reuse** inherited methods as they are,
- **add** new fields and methods of its own,
- **override** an inherited method to behave differently for this kind of object.

The child's constructor must make sure the parent part is set up too. In Java that is the \`super(...)\` call on the first line; in Python it is \`super().__init__(...)\`; in C++ it is the base class in the initialiser list. Skipping it leaves the parent's invariants unestablished.

## Overriding, and calling the parent's version

When a subclass overrides a method, calls through any reference to that object use the subclass version. That is what makes inheritance powerful: code written against \`LibraryItem\` keeps working when you hand it an \`EBook\`. An override can still call the parent's implementation with \`super.method()\` and add to it, which is common for things like \`toString\` or validation.

In Java, mark overrides with \`@Override\` so the compiler catches a typo that would otherwise silently add a new method. In C++, the parent method must be \`virtual\` and the child should say \`override\`.

## The substitution rule

A subclass must be usable anywhere its parent is expected without surprising the caller. This is the **Liskov substitution principle**, and it is the real test of whether inheritance fits. The classic failure is \`Square extends Rectangle\`: a rectangle lets you set width and height independently, a square can't, so code that sets the width of a "rectangle" and expects the height to stay put breaks when given a square.

If a child has to throw "not supported" for a parent method, or weaken a promise the parent made, the hierarchy is wrong.

## Single and multiple inheritance

Java and C# allow a class to extend only one class (but implement many interfaces). C++ and Python allow multiple inheritance, which brings the **diamond problem**: if two parents both inherit from a common grandparent and override the same method, which version does the child get? C++ answers with virtual inheritance; Python with a method resolution order (\`ClassName.__mro__\`). Most designs avoid the question entirely by inheriting behaviour from one class and capabilities from interfaces.

## Costs to keep in mind

Inheritance is the tightest coupling in object-oriented code. A child depends on its parent's internals, so a change to the parent can break every child, even ones you have never seen: the *fragile base class* problem. Deep hierarchies (five or six levels) are hard to follow because behaviour is spread across files.

Keep hierarchies shallow, design parents deliberately for extension (or mark them \`final\` when they are not), and reach for inheritance only when the "is a" relationship and substitution both hold.`,
  code: {
    java: `public class LibraryItem {
    private final String title;
    protected final int loanDays;

    public LibraryItem(String title, int loanDays) {
        this.title = title;
        this.loanDays = loanDays;
    }

    public String title() {
        return title;
    }

    public String describe() {
        return title + " (" + loanDays + "-day loan)";
    }
}

class EBook extends LibraryItem {
    private final double sizeMb;

    EBook(String title, double sizeMb) {
        super(title, 21);
        this.sizeMb = sizeMb;
    }

    @Override
    public String describe() {
        return super.describe() + ", " + sizeMb + " MB download";
    }
}`,
    python: `class LibraryItem:
    def __init__(self, title: str, loan_days: int) -> None:
        self.title = title
        self.loan_days = loan_days

    def describe(self) -> str:
        return f"{self.title} ({self.loan_days}-day loan)"


class EBook(LibraryItem):
    def __init__(self, title: str, size_mb: float) -> None:
        super().__init__(title, loan_days=21)
        self.size_mb = size_mb

    def describe(self) -> str:
        return f"{super().describe()}, {self.size_mb} MB download"


for item in [LibraryItem("Atlas", 7), EBook("Dune", 2.4)]:
    print(item.describe())`,
    cpp: `#include <iostream>
#include <memory>
#include <string>
#include <vector>

class LibraryItem {
public:
    LibraryItem(std::string title, int loanDays) : title_(std::move(title)), loanDays_(loanDays) {}
    virtual ~LibraryItem() = default;

    virtual std::string describe() const {
        return title_ + " (" + std::to_string(loanDays_) + "-day loan)";
    }

private:
    std::string title_;
    int loanDays_;
};

class EBook : public LibraryItem {
public:
    EBook(std::string title, double sizeMb) : LibraryItem(std::move(title), 21), sizeMb_(sizeMb) {}

    std::string describe() const override {
        return LibraryItem::describe() + ", " + std::to_string(sizeMb_) + " MB download";
    }

private:
    double sizeMb_;
};

int main() {
    std::vector<std::unique_ptr<LibraryItem>> items;
    items.push_back(std::make_unique<LibraryItem>("Atlas", 7));
    items.push_back(std::make_unique<EBook>("Dune", 2.4));
    for (const auto& item : items) std::cout << item->describe() << '\\n';
}`,
  },
  quiz: [
    { id: 'in-1', prompt: 'When is inheritance the right tool?', options: ['When the child is a kind of the parent and can stand in for it', 'When two classes share a few lines of code', 'Whenever a class has more than five methods', 'When one class contains another'], answer: 0, why: 'Inheritance models "is a" plus substitutability. "Has a" relationships call for composition.' },
    { id: 'in-2', prompt: 'Why does a Square extending Rectangle often break code?', options: ['Squares have fewer fields', 'Rectangle callers expect width and height to change independently, which a square can\'t honour', 'Java forbids it', 'Squares cannot override methods'], answer: 1, why: 'It violates the Liskov substitution principle: the subclass weakens a promise the parent made.' },
    { id: 'in-3', prompt: 'What does @Override (Java) or override (C++) protect you from?', options: ['Slower method calls', 'Memory leaks', 'Accidentally adding a new method because of a typo in the name or parameters', 'Calling the parent constructor twice'], answer: 2, why: 'The compiler checks that the method really overrides one in the parent.' },
    { id: 'in-4', prompt: 'What is the fragile base class problem?', options: ['Base classes cannot have constructors', 'Subclasses cannot call super', 'Base classes are always abstract', 'Changes inside a parent class can unexpectedly break its subclasses'], answer: 3, why: 'Inheritance couples children to their parent\'s internals, so parent changes ripple down.' },
    { id: 'in-5', prompt: 'Which languages allow a class to inherit from more than one class?', options: ['C++ and Python', 'Java and C#', 'Only Java', 'None of them'], answer: 0, why: 'C++ and Python support multiple inheritance; Java and C# allow one superclass plus many interfaces.' },
  ],
  interview: [
    { q: 'What is the Liskov substitution principle?', a: 'Objects of a subclass must be usable wherever the parent type is expected without breaking the caller: same or weaker preconditions, same or stronger guarantees. Square extending Rectangle is the classic violation.' },
    { q: 'What is the diamond problem and how do languages handle it?', a: 'With multiple inheritance, a class can inherit the same method from two parents that share a grandparent. C++ resolves it with virtual inheritance and explicit qualification; Python uses the method resolution order; Java avoids it by allowing one superclass (and resolves default-method clashes in interfaces explicitly).' },
    { q: 'Why is a deep inheritance hierarchy a problem?', a: 'Behaviour is spread across many files, every level is coupled to the ones above, and a change near the top can break leaves nobody remembers. Shallow hierarchies plus composition are easier to change.' },
  ],
}

export default lesson
