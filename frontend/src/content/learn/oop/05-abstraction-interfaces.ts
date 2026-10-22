import type { Lesson } from '../types'

const lesson: Lesson = {
  id: 'abstraction-interfaces',
  title: 'Abstraction & interfaces',
  minutes: 9,
  diagram: 'interface-impl',
  body: `## Say what, not how

**Abstraction** means exposing what something does while hiding how it does it. A \`PaymentGateway\` offers \`charge(amount)\`; whether that talks to a card network, a wallet or a test double is invisible to the checkout code. The caller depends on the idea, not the machinery.

Encapsulation hides an object's *data*. Abstraction hides a whole *implementation* behind a smaller, simpler surface. The two work together, but they are not the same thing, and interviewers often ask you to separate them.

## Interfaces are contracts

An **interface** lists methods without implementing them. Any class that implements the interface promises to provide those methods. Code written against the interface works with every implementation, including ones written years later.

\`\`\`
interface Notifier { void send(String to, String message); }
class EmailNotifier implements Notifier { ... }
class SmsNotifier implements Notifier { ... }
\`\`\`

A class can implement many interfaces, which is how Java and C# offer the flexibility of multiple inheritance without the diamond problem: interfaces describe capabilities (\`Comparable\`, \`Closeable\`, \`Notifier\`), and a class can have several.

Modern Java interfaces may carry \`default\` methods with a body, which helps evolve an interface without breaking implementers. Python expresses interfaces with abstract base classes (\`abc.ABC\` and \`@abstractmethod\`) or structural \`Protocol\` types. C++ uses a class whose methods are all *pure virtual* (\`= 0\`).

## Abstract classes sit in between

An **abstract class** can't be instantiated, but unlike an interface it can hold fields, constructors and finished methods alongside abstract ones. Use it when implementations share real state or a fixed algorithm with a few steps left open.

How to choose:

- **Interface** when unrelated classes should share a capability, or when you want the thinnest possible dependency.
- **Abstract class** when the subclasses are genuinely the same kind of thing and share code and state.

When in doubt, start with an interface. It keeps callers decoupled, and you can add an abstract base class behind it later for shared code.

## Programming to an interface

"Program to an interface, not an implementation" is one of the oldest pieces of design advice. Declare variables, parameters and return types with the abstract type: \`List<Book> books = new ArrayList<>()\`, not \`ArrayList<Book>\`. Then the concrete choice is made in one place and can change without a ripple.

This is also what makes code testable. If \`OrderService\` takes a \`Notifier\` in its constructor, a test can pass a fake that records messages instead of sending real emails. Passing dependencies in from outside like this is called **dependency injection**, and it only works because of abstraction.

## Good abstractions are small

A useful abstraction has few methods, each meaningful to its callers. An interface with twenty methods forces every implementer to write twenty methods, and most callers use three. Split it by who uses it (the *interface segregation principle*, covered with SOLID).

Leaky abstractions are the opposite failure: the interface claims to hide something but callers still need to know about it, such as a \`Storage\` interface whose \`save\` behaves differently on disk and in the cloud in ways callers must handle. Name the cost honestly in the contract, or the abstraction will mislead.`,
  code: {
    java: `import java.util.ArrayList;
import java.util.List;

public interface Notifier {
    void send(String to, String message);

    default void sendAll(List<String> recipients, String message) {
        for (String r : recipients) send(r, message);
    }
}

abstract class TemplatedNotifier implements Notifier {
    private final String signature;

    TemplatedNotifier(String signature) {
        this.signature = signature;
    }

    @Override
    public final void send(String to, String message) {
        deliver(to, message + "\\n-- " + signature);
    }

    protected abstract void deliver(String to, String body);
}

class FakeNotifier extends TemplatedNotifier {
    final List<String> sent = new ArrayList<>();

    FakeNotifier() {
        super("Library");
    }

    @Override
    protected void deliver(String to, String body) {
        sent.add(to + ": " + body);
    }
}`,
    python: `from abc import ABC, abstractmethod


class Notifier(ABC):
    @abstractmethod
    def send(self, to: str, message: str) -> None: ...

    def send_all(self, recipients: list[str], message: str) -> None:
        for r in recipients:
            self.send(r, message)


class FakeNotifier(Notifier):
    def __init__(self) -> None:
        self.sent: list[str] = []

    def send(self, to: str, message: str) -> None:
        self.sent.append(f"{to}: {message}")


class OrderService:
    def __init__(self, notifier: Notifier) -> None:  # dependency injection
        self.notifier = notifier

    def place(self, customer: str) -> None:
        self.notifier.send(customer, "Your order is confirmed")`,
    cpp: `#include <string>
#include <vector>

class Notifier {
public:
    virtual ~Notifier() = default;
    virtual void send(const std::string& to, const std::string& message) = 0;
};

class FakeNotifier : public Notifier {
public:
    void send(const std::string& to, const std::string& message) override {
        sent.push_back(to + ": " + message);
    }
    std::vector<std::string> sent;
};

class OrderService {
public:
    explicit OrderService(Notifier& notifier) : notifier_(notifier) {}
    void place(const std::string& customer) { notifier_.send(customer, "Your order is confirmed"); }

private:
    Notifier& notifier_;
};`,
  },
  quiz: [
    { id: 'ab-1', prompt: 'What does abstraction hide?', options: ['An object\'s private fields only', 'How something is implemented, behind a simpler description of what it does', 'The class name', 'Compiler errors'], answer: 1, why: 'Abstraction exposes what and hides how; encapsulation is specifically about protecting an object\'s data.' },
    { id: 'ab-2', prompt: 'When is an abstract class a better fit than an interface?', options: ['When unrelated classes share a capability', 'When subclasses share real state and code, with a few steps left open', 'When you need multiple inheritance in Java', 'Never'], answer: 1, why: 'Abstract classes can hold fields, constructors and finished methods; interfaces describe capabilities.' },
    { id: 'ab-3', prompt: 'Why declare List<Book> books = new ArrayList<>() instead of ArrayList<Book>?', options: ['ArrayList is deprecated', 'Callers depend only on List, so the implementation can change in one place', 'It uses less memory', 'Generics require it'], answer: 1, why: 'Programming to an interface keeps the concrete choice isolated.' },
    { id: 'ab-4', prompt: 'OrderService receives a Notifier in its constructor. What does this make easy?', options: ['Sending faster emails', 'Testing with a fake notifier that records messages', 'Avoiding interfaces', 'Serialising the service'], answer: 1, why: 'Dependency injection plus abstraction lets tests substitute a fake implementation.' },
    { id: 'ab-5', prompt: 'How does C++ express an interface?', options: ['With the interface keyword', 'A class whose methods are pure virtual (= 0)', 'A struct with only static members', 'A template with no parameters'], answer: 1, why: 'Pure virtual functions make the class abstract; implementers must override them.' },
  ],
  interview: [
    { q: 'Interface vs abstract class: when do you use each?', a: 'Interface for a capability unrelated classes can share and for the thinnest dependency; a class can implement many. Abstract class when the subclasses are the same kind of thing and share state or a fixed algorithm. Start with an interface and add an abstract base for shared code if needed.' },
    { q: 'What is the difference between abstraction and encapsulation?', a: 'Encapsulation protects an object\'s data by restricting access to it. Abstraction hides an implementation behind a simpler contract describing what it does. A well-designed class does both.' },
    { q: 'What is dependency injection and why does it help?', a: 'Passing an object\'s collaborators in (usually via the constructor) rather than creating them inside. Combined with interfaces, it decouples the class from concrete implementations and lets tests supply fakes.' },
  ],
}

export default lesson
