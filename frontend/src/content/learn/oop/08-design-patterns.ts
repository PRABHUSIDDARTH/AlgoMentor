import type { Lesson } from '../types'

const lesson: Lesson = {
  id: 'design-patterns',
  title: 'Core design patterns',
  minutes: 11,
  hook: 'A shop prices items with an `if` chain on customer type, and every new discount means editing the same method and re-testing the old rules. Patterns exist for this kind of repeated pain. Five of them, Singleton, Factory, Strategy, Observer and Decorator, cover most design questions and a lot of everyday code.',
  keyPoints: [
    'A design pattern is a named, reusable shape for a recurring problem. The name gives a team shared vocabulary.',
    'Singleton, Factory, Strategy, Observer and Decorator cover one instance, hidden construction, swappable rules, notification and wrapping.',
    'Each pattern has a cost. Singleton hides global state, and Observer can leak listeners that are never removed.',
    'Start from the problem, then name the pattern. Using one because it exists produces over-engineered code.',
  ],
  body: `## Named solutions to recurring problems

A **design pattern** is a reusable shape for solving a problem that keeps coming up. Patterns give teams shared vocabulary: "make the pricing a Strategy" says in four words what would otherwise take a paragraph. Five patterns cover most interview questions and most everyday code.

> [!KEY] Problem first, name second
> A pattern is the answer to a question. State the problem in your own words first (the rule varies, several parts must react), then give the pattern's name. A pattern with no problem behind it is just extra classes.

## Singleton

**Problem:** exactly one instance of something should exist, such as a configuration registry or a connection pool.

**Shape:** a private constructor and a static accessor that returns the one instance.

**Caution:** a Singleton is global state in disguise. It hides dependencies (any code can grab it), makes tests share state, and needs care with threads. Prefer creating one instance at start-up and passing it to whoever needs it. When you do write one, make initialisation thread-safe; in Java the simplest way is an \`enum\` with a single value or a static holder class.

> [!GOTCHA] The lazy singleton race
> The usual lazy version checks whether the instance is null and then creates it. Two threads can both pass the check and each build one, so the "single" registry exists twice with different state. Create it at start-up, use an enum or static holder, or guard the check with a lock.

## Factory

**Problem:** callers need an object but shouldn't know which concrete class to build, or construction is complicated.

**Shape:** a method (or class) that decides what to create and returns it through an interface: \`Vehicle v = VehicleFactory.forTicket(ticket)\`.

Factories keep \`new ConcreteClass()\` in one place, so adding a new type changes the factory and nothing else. A related pattern, **Builder**, handles objects with many optional parameters by setting them step by step before a final \`build()\`.

## Strategy

**Problem:** an algorithm or rule varies, and you want to choose it at run time.

**Shape:** an interface for the behaviour, one class per variant, and a host that holds one and delegates to it. Pricing rules, sorting comparisons, payment methods and retry policies are all strategies. It is the cleanest way to replace a growing \`if\`/\`switch\` on a type.

> [!INTERVIEW] Pricing means Strategy
> When a prompt has a rule that varies, such as pricing, payment or discounts, the expected pattern is Strategy. Say which \`switch\` it replaces and what it costs: one more class per variant. Interviewers listen for the problem you name before the pattern.

## Observer

**Problem:** when something changes, several other parts of the system need to react, and the source shouldn't know who they are.

**Shape:** a *subject* keeps a list of *observers* (listeners) and notifies each when its state changes. A stock price notifies charts and alerts; a "book returned" event notifies the waiting-list service and the fines service. UI frameworks, event buses and reactive streams are all built on Observer.

**Caution:** observers that are never removed keep objects alive (a memory leak), and long chains of events can be hard to debug. Unsubscribe when a listener's owner goes away.

> [!TRY] The listener that leaves
> A listener removes itself while the subject loops over the list. Which letters print?
>
> \`\`\`python
> subs = []
>
> def once():
>     print("a")
>     subs.remove(once)
>
> def other():
>     print("b")
>
> subs.extend([once, other])
> for s in subs:
>     s()
> \`\`\`
>
> ---
>
> Only \`a\`. Removing an entry shifts the next one into the position the loop has already passed, so \`other\` is never called. Loop over a copy (\`for s in list(subs)\`) or collect removals until the loop ends.

## Decorator

**Problem:** add responsibilities to an object without changing its class or creating a subclass for every combination.

**Shape:** a wrapper that implements the same interface as the object it wraps, adds behaviour, and forwards the rest. Java's I/O streams are the textbook case: \`new BufferedReader(new InputStreamReader(new FileInputStream(f)))\`. In web services, logging, caching, retries and metrics are often decorators around a client.

Decorator and inheritance both add behaviour, but decorators stack in any order at run time, and each one stays small.

## Using patterns well

Patterns are answers, so start from the question. Reaching for a pattern because it exists leads to over-engineered code: a factory that only ever builds one class, an observer bus for two objects. In interviews, name the pattern, say what problem it solves in this design, and mention its main cost. That shows judgement, which is what the question is really testing.`,
  code: {
    java: `import java.util.ArrayList;
import java.util.List;

public interface PricingStrategy {
    long priceCents(int hours);
}

class HourlyPricing implements PricingStrategy {
    public long priceCents(int hours) {
        return hours * 200L;
    }
}

class FlatDailyPricing implements PricingStrategy {
    public long priceCents(int hours) {
        return Math.min(hours * 200L, 1500L);
    }
}

// Factory: one place decides which concrete strategy to build.
final class PricingFactory {
    private PricingFactory() {
    }

    static PricingStrategy forCustomer(boolean member) {
        return member ? new FlatDailyPricing() : new HourlyPricing();
    }
}

// Observer: listeners react to events without the source knowing them.
interface SpotListener {
    void spotFreed(String spotId);
}

class Spots {
    private final List<SpotListener> listeners = new ArrayList<>();

    void subscribe(SpotListener l) {
        listeners.add(l);
    }

    void free(String spotId) {
        for (SpotListener l : listeners) l.spotFreed(spotId);
    }
}

// Decorator: same interface, extra behaviour, forwards the rest.
class LoggingPricing implements PricingStrategy {
    private final PricingStrategy inner;

    LoggingPricing(PricingStrategy inner) {
        this.inner = inner;
    }

    public long priceCents(int hours) {
        long p = inner.priceCents(hours);
        System.out.println(hours + "h -> " + p);
        return p;
    }
}

// Singleton done safely in Java: an enum with one value.
enum AppConfig {
    INSTANCE;

    final int maxHours = 24;
}`,
    python: `from typing import Callable, Protocol


class PricingStrategy(Protocol):
    def price_cents(self, hours: int) -> int: ...


class HourlyPricing:
    def price_cents(self, hours: int) -> int:
        return hours * 200


class FlatDailyPricing:
    def price_cents(self, hours: int) -> int:
        return min(hours * 200, 1500)


def pricing_for(member: bool) -> PricingStrategy:  # factory
    return FlatDailyPricing() if member else HourlyPricing()


class Spots:  # observer subject
    def __init__(self) -> None:
        self._listeners: list[Callable[[str], None]] = []

    def subscribe(self, listener: Callable[[str], None]) -> None:
        self._listeners.append(listener)

    def free(self, spot_id: str) -> None:
        for listener in self._listeners:
            listener(spot_id)


class LoggingPricing:  # decorator
    def __init__(self, inner: PricingStrategy) -> None:
        self.inner = inner

    def price_cents(self, hours: int) -> int:
        price = self.inner.price_cents(hours)
        print(f"{hours}h -> {price}")
        return price`,
    cpp: `#include <algorithm>
#include <functional>
#include <iostream>
#include <memory>
#include <string>
#include <vector>

class PricingStrategy {
public:
    virtual ~PricingStrategy() = default;
    virtual long long priceCents(int hours) const = 0;
};

class HourlyPricing : public PricingStrategy {
public:
    long long priceCents(int hours) const override { return hours * 200LL; }
};

class FlatDailyPricing : public PricingStrategy {
public:
    long long priceCents(int hours) const override { return std::min(hours * 200LL, 1500LL); }
};

std::unique_ptr<PricingStrategy> pricingFor(bool member) {  // factory
    if (member) return std::make_unique<FlatDailyPricing>();
    return std::make_unique<HourlyPricing>();
}

class Spots {  // observer subject
public:
    void subscribe(std::function<void(const std::string&)> listener) { listeners_.push_back(std::move(listener)); }
    void free(const std::string& spotId) {
        for (auto& l : listeners_) l(spotId);
    }

private:
    std::vector<std::function<void(const std::string&)>> listeners_;
};

class LoggingPricing : public PricingStrategy {  // decorator
public:
    explicit LoggingPricing(std::unique_ptr<PricingStrategy> inner) : inner_(std::move(inner)) {}
    long long priceCents(int hours) const override {
        long long p = inner_->priceCents(hours);
        std::cout << hours << "h -> " << p << '\\n';
        return p;
    }

private:
    std::unique_ptr<PricingStrategy> inner_;
};

class Config {  // singleton: thread-safe local static since C++11
public:
    static Config& instance() {
        static Config c;
        return c;
    }
    int maxHours = 24;

private:
    Config() = default;
};`,
  },
  quiz: [
    { id: 'dp-1', prompt: 'Which pattern lets you swap a pricing rule at run time without if/else chains?', options: ['Singleton', 'Builder', 'Decorator', 'Strategy'], answer: 3, why: 'Strategy puts each variant behind a shared interface; the host delegates to whichever one it holds.' },
    { id: 'dp-2', prompt: 'new BufferedReader(new InputStreamReader(stream)) is an example of:', options: ['Observer', 'Factory', 'Decorator', 'Singleton'], answer: 2, why: 'Each wrapper implements the same reader interface and adds behaviour around the one it wraps.' },
    { id: 'dp-3', prompt: 'What is the main criticism of the Singleton pattern?', options: ['It uses too much memory', 'It is global state that hides dependencies and complicates testing', 'It cannot be made thread-safe', 'It requires inheritance'], answer: 1, why: 'Any code can reach a singleton, so dependencies are invisible and tests share state.' },
    { id: 'dp-4', prompt: 'When a book is returned, the waiting list and the fines service must both react. Which pattern fits?', options: ['Observer', 'Factory', 'Strategy', 'Decorator'], answer: 0, why: 'The subject notifies registered observers without knowing who they are.' },
    { id: 'dp-5', prompt: 'What problem does a Factory solve?', options: ['Ensuring one instance exists', 'Adding behaviour to an object at run time', 'Notifying listeners', 'Hiding which concrete class is created and keeping construction in one place'], answer: 3, why: 'Callers ask for an interface; the factory decides the concrete type, so new types change only the factory.' },
  ],
  interview: [
    { q: 'How would you make a Singleton thread-safe in Java?', a: 'Use an enum with a single value, or a static holder class whose static field is initialised by the class loader on first access. Both are lazily initialised and thread-safe without explicit locking. Often better: create one instance at start-up and inject it.' },
    { q: 'Strategy vs Decorator: what is the difference?', a: 'Strategy replaces one behaviour with an interchangeable implementation chosen by the host. Decorator wraps an object with the same interface to add behaviour around it, and decorators can be stacked.' },
    { q: 'What can go wrong with Observer?', a: 'Listeners that are never unsubscribed leak memory; notification order can be implicit; cascades of events are hard to trace; and a slow observer can block the subject if notifications are synchronous.' },
  ],
}

export default lesson
