export class ElementBuilder {
    constructor(tag) {
        this.element = document.createElement(tag);
    }

    id(id) {
        this.element.id = id;
        return this;
    }

    class(clazz) {
        const classes = clazz.split(' ');
        classes.forEach(cls => this.element.classList.add(cls));
        return this;
    }

    attr(attr) {
        for (const [key, value] of Object.entries(attr)) {
            this.element.setAttribute(key, value);
        }
        return this;
    }

    innerHTML(innerHtml) {
        this.element.innerHTML = innerHtml;
        return this;
    }

    append(child) {
        child.appendTo(this.element);
        return this;
    }

    appendTo(parent) {
        parent.appendChild(this.element);
        return this;
    }

    text(content) {
        this.element.textContent = content;
        return this;
    }

    with(name, value) {
        this.element.setAttribute(name, value);
        return this;
    }

    listener(name, listener) {
        this.element.addEventListener(name, listener);
        return this;
    }

    build() {
        return this.element;
    }
}

export class ButtonBuilder extends ElementBuilder {
    constructor(text) {
        super("button").with("type", "button").text(text)
    }

    onclick(handler) {
        return this.listener("click", handler)
    }
}

export class ToastBuilder extends ElementBuilder {
    constructor() {
        super('div')
            .class("uiToast toast text-white top-0 start-50 translate-middle-x position-fixed fade")
            .attr({
                'data-bs-autohide': 'true',
                'data-bs-delay': '5000',
                'role': 'alert',
                'aria-live': 'assertive',
                'aria-atomic': 'true'
            })
            .append(new ElementBuilder('div')
                .class('d-flex')
                .append(new ElementBuilder('div').class('toast-body'))
                .append(new ElementBuilder('button')
                    .class('btn-close btn-close-white me-2 m-auto')
                    .attr({
                        'data-bs-dismiss': 'toast',
                        'aria-label': 'Close',
                        'type': 'button',
                    }))
            )
            .appendTo(document.body);

        this.toast = new bootstrap.Toast(this.build());
    }

    setType(type) {
        let toastClass;
        switch (type) {
            case "warning":
                toastClass = "bg-warning";
                break;
            case "error":
                toastClass = "bg-danger";
                break;
            case "info":
                toastClass = "bg-info";
                break;
            default:
                toastClass = "bg-success";
        }

        this.element.classList.add(toastClass);
    }

    setBody(content) {
        const bodyElement = this.element.querySelector('.toast-body');
        if (bodyElement) {
            bodyElement.innerHTML = content;
        } else {
            console.warn("Element doesn't have a .toast-body child element.");
        }
        return this;
    }

    show() {
        this.toast.show();
    }

    hide() {
        this.toast.hide();
    }
}