import type { Lesson } from '../types'

const lesson: Lesson = {
  id: 'solid',
  title: 'SOLID',
  minutes: 10,
  body: `## Five principles for code that bends instead of breaking

**SOLID** is an acronym for five design principles. None of them is a law; each one names a common way object-oriented code becomes hard to change and suggests how to avoid it. Know each by name, a one-line definition and a small example, because interviewers ask for exactly that.

## S: Single responsibility

*A class should have one reason to change.* A \`Report\` class that computes figures, formats them as HTML and emails them changes whenever the maths, the layout or the mail server changes. Split it into \`ReportCalculator\`, \`HtmlReportFormatter\` and \`ReportMailer\`. Each is smaller, easier to test, and a change in one area can't break the others.

"Responsibility" means a reason to change, usually tied to one group of people asking for changes, not "does one tiny thing". A class with ten methods can still have a single responsibility.

## O: Open/closed

*Software should be open for extension and closed for modification.* You should be able to add behaviour by adding code, not by editing code that already works. A \`DiscountCalculator\` full of \`if customerType == ...\` must be edited for every new customer type. Give it a \`DiscountPolicy\` interface instead; a new type is a new class, and the calculator never changes.

## L: Liskov substitution

*Subtypes must be usable wherever their base type is expected.* If code works with a \`Bird\` and breaks when given a \`Penguin\` because \`fly()\` throws, the hierarchy is wrong. Either not every bird flies (split \`FlyingBird\` out), or penguins don't belong under \`Bird\` as modelled. Substitution failures show up as \`instanceof\` checks and "not supported" exceptions.

## I: Interface segregation

*Clients should not depend on methods they don't use.* A \`Machine\` interface with \`print\`, \`scan\` and \`fax\` forces a simple printer to implement \`fax\` with an error. Split it into \`Printer\`, \`Scanner\` and \`Fax\`. A multifunction device implements all three, the simple printer only one, and callers depend only on what they call.

## D: Dependency inversion

*High-level policy should not depend on low-level details; both should depend on abstractions.* An \`OrderService\` that creates a \`MySqlOrderRepository\` itself is welded to MySQL. Make it depend on an \`OrderRepository\` interface and receive the implementation from outside. The business rules now sit above the database, and the database adapts to them, not the other way round. This is what makes swapping storage or testing with an in-memory fake possible.

## How the principles relate

They reinforce each other. Single responsibility produces small classes; interface segregation keeps their contracts small; dependency inversion connects them through those contracts; open/closed is what you get as a result, since new behaviour plugs in as new classes; and Liskov substitution keeps the plugging-in safe.

## Applying them with judgement

Over-applying SOLID produces a different mess: an interface for every class, factories for factories, and a feature spread across fifteen files. Apply a principle when you feel the pain it prevents, or when the change it enables is likely. In an interview, it is worth saying this explicitly. Reviewers trust a designer who knows when not to add an abstraction more than one who adds them everywhere.`,
  code: {
    java: `import java.util.List;

public interface DiscountPolicy {
    long discountCents(long totalCents);
}

class NoDiscount implements DiscountPolicy {
    public long discountCents(long totalCents) {
        return 0;
    }
}

class StudentDiscount implements DiscountPolicy {
    public long discountCents(long totalCents) {
        return totalCents / 10;
    }
}

interface OrderRepository {
    void save(String orderId, long totalCents);
}

// Depends on abstractions (DIP); new policies need no edits here (OCP).
class Checkout {
    private final DiscountPolicy policy;
    private final OrderRepository orders;

    Checkout(DiscountPolicy policy, OrderRepository orders) {
        this.policy = policy;
        this.orders = orders;
    }

    long pay(String orderId, List<Long> lineCents) {
        long total = lineCents.stream().mapToLong(Long::longValue).sum();
        long due = total - policy.discountCents(total);
        orders.save(orderId, due);
        return due;
    }
}`,
    python: `from typing import Protocol


class DiscountPolicy(Protocol):
    def discount_cents(self, total_cents: int) -> int: ...


class OrderRepository(Protocol):
    def save(self, order_id: str, total_cents: int) -> None: ...


class StudentDiscount:
    def discount_cents(self, total_cents: int) -> int:
        return total_cents // 10


class InMemoryOrders:
    def __init__(self) -> None:
        self.saved: dict[str, int] = {}

    def save(self, order_id: str, total_cents: int) -> None:
        self.saved[order_id] = total_cents


class Checkout:
    def __init__(self, policy: DiscountPolicy, orders: OrderRepository) -> None:
        self.policy = policy
        self.orders = orders

    def pay(self, order_id: str, line_cents: list[int]) -> int:
        total = sum(line_cents)
        due = total - self.policy.discount_cents(total)
        self.orders.save(order_id, due)
        return due`,
    cpp: `#include <numeric>
#include <string>
#include <vector>

class DiscountPolicy {
public:
    virtual ~DiscountPolicy() = default;
    virtual long long discountCents(long long totalCents) const = 0;
};

class StudentDiscount : public DiscountPolicy {
public:
    long long discountCents(long long totalCents) const override { return totalCents / 10; }
};

class OrderRepository {
public:
    virtual ~OrderRepository() = default;
    virtual void save(const std::string& orderId, long long totalCents) = 0;
};

class Checkout {
public:
    Checkout(const DiscountPolicy& policy, OrderRepository& orders) : policy_(policy), orders_(orders) {}

    long long pay(const std::string& orderId, const std::vector<long long>& lineCents) {
        long long total = std::accumulate(lineCents.begin(), lineCents.end(), 0LL);
        long long due = total - policy_.discountCents(total);
        orders_.save(orderId, due);
        return due;
    }

private:
    const DiscountPolicy& policy_;
    OrderRepository& orders_;
};`,
  },
  quiz: [
    { id: 'so-1', prompt: 'A Report class computes figures, renders HTML and emails the result. Which principle does it break?', options: ['Liskov substitution', 'Single responsibility', 'Interface segregation', 'Open/closed only'], answer: 1, why: 'It has three reasons to change (maths, layout, delivery), so it should be split.' },
    { id: 'so-2', prompt: 'Adding a new customer type requires editing DiscountCalculator\'s if-chain. Which principle is violated?', options: ['Open/closed', 'Dependency inversion', 'Single responsibility', 'Liskov substitution'], answer: 0, why: 'New behaviour should arrive as new code (a new policy class), not edits to working code.' },
    { id: 'so-3', prompt: 'A SimplePrinter must implement fax() and throws "not supported". Which principle helps most?', options: ['Single responsibility', 'Open/closed', 'Dependency inversion', 'Interface segregation'], answer: 3, why: 'Split the fat Machine interface so each client depends only on the methods it uses.' },
    { id: 'so-4', prompt: 'OrderService creates new MySqlOrderRepository() inside itself. What does dependency inversion suggest?', options: ['Use a static MySQL helper', 'Inherit from MySqlOrderRepository', 'Depend on an OrderRepository abstraction and receive the implementation from outside', 'Move SQL into the controller'], answer: 2, why: 'High-level policy should depend on abstractions; details plug in from outside.' },
    { id: 'so-5', prompt: 'Code checks if (bird instanceof Penguin) before calling fly(). This signals a problem with:', options: ['Interface segregation', 'Liskov substitution', 'Single responsibility', 'Nothing, this is normal'], answer: 1, why: 'Type checks to avoid a method mean the subtype is not substitutable for its parent.' },
  ],
  interview: [
    { q: 'Explain each SOLID principle in one sentence.', a: 'S: one reason to change per class. O: extend behaviour by adding code, not editing it. L: subtypes must work wherever the parent works. I: clients shouldn\'t depend on methods they don\'t use. D: depend on abstractions, not concrete details.' },
    { q: 'Can SOLID be overdone?', a: 'Yes. An interface per class, factories everywhere and features scattered across many files make code harder to follow. Apply a principle when the change it enables is likely or the pain it prevents is real.' },
    { q: 'How does dependency inversion relate to dependency injection?', a: 'Dependency inversion is the principle (depend on abstractions owned by the high-level code). Dependency injection is a technique for wiring it: pass the concrete implementation in from outside, usually through the constructor.' },
  ],
}

export default lesson
