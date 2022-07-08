import { h } from 'preact';
import type { ComponentChild, VNode } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

import './style.scss';

interface Props {
    children: ComponentChild | ComponentChild[];
    attribute?: string;
    template?: (content: string) => VNode;
    placement?: 'top' | 'bottom' | 'left' | 'right';
}

export default function Container(props: Props): VNode {
    const attribute = props.attribute || 'data-hint';
    const [content, setContent] = useState<string>('');
    const [containerElement, setContainerElement] = useState<HTMLDivElement | null>(null);
    const [targetBoundingRect, setTargetBoundingRect] = useState<ClientRect | null>(null);

    const onRefChange = useCallback(
        (node: HTMLDivElement | null) => {
            setContainerElement(node);
            if (containerElement) {
              const showTooltip = (e: Event) => {
                    if (e.target instanceof Element && e.target.hasAttribute(attribute)) {
                        setContent(e.target.getAttribute(attribute) || '');
                        setTargetBoundingRect(e.target.getBoundingClientRect());
                    }
                };

                const hideTooltip = (e: Event) => {
                    if (e.target instanceof Element && e.target.hasAttribute(attribute)) {
                        setContent('');
                        setTargetBoundingRect(null);
                    }
                };

                containerElement.addEventListener('mouseover', showTooltip);
                containerElement.addEventListener('focusin', showTooltip);
                containerElement.addEventListener('mouseout', hideTooltip);
                containerElement.addEventListener('focusout', hideTooltip);
            }
        },
        [containerElement],
    );

    return (
        <div ref={onRefChange} style="position: relative">
            {content && containerElement && targetBoundingRect && (
                <Hint
                    content={content}
                    template={props.template}
                    rootBoundingRect={containerElement.getBoundingClientRect()}
                    targetBoundingRect={targetBoundingRect}
                    placement={props.placement || 'top'}
                />
            )}
            {props.children}
        </div>
    );
}

interface HintProps {
    content: string;
    template?: (content: string) => VNode;
    rootBoundingRect: ClientRect;
    targetBoundingRect: ClientRect;
    placement: 'top' | 'bottom' | 'left' | 'right';
}

function Hint(props: HintProps): VNode {
    const hint = useRef<HTMLSpanElement>(null);
    // Render way off-screen to prevent rubber banding from initial (and unavoidable) render.
    const [hintSize, setHintSize] = useState({ width: 10000, height: 10000 });

    useEffect(() => {
        if (hint.current) {
            const boundingRect = hint.current.getBoundingClientRect();
            setHintSize({ width: boundingRect.width, height: boundingRect.height });
        }
    }, [hint]);

    const centeredX =
        props.targetBoundingRect.left -
        props.rootBoundingRect.left -
        hintSize.width / 2 +
        props.targetBoundingRect.width / 2;

    const centeredY =
        props.targetBoundingRect.top -
        props.rootBoundingRect.top -
        hintSize.height / 2 +
        props.targetBoundingRect.height / 2;

    const style = {
        'top': {
            bottom:
                props.rootBoundingRect.height -
                props.targetBoundingRect.top +
                props.rootBoundingRect.top +
                2,
            left: centeredX,
        },

        'bottom': {
            top:
                props.rootBoundingRect.height +
                props.targetBoundingRect.bottom -
                props.rootBoundingRect.bottom +
                2,
            left: centeredX,
        },

        'left': {
            right:
                props.rootBoundingRect.width +
                props.targetBoundingRect.left -
                props.rootBoundingRect.left +
                2,
            top: centeredY,
        },

        'right': {
            left:
                props.rootBoundingRect.width +
                props.targetBoundingRect.right -
                props.rootBoundingRect.right +
                2,
            top: centeredY,
        },
    }[props.placement];

    return (
        <div
            class="preact-hint preact-hint__fade-in"
            data-placement={props.placement}
            {...{style}}
        >
            <span class="preact-hint__content" ref={hint}>
                {props.template ? props.template(props.content) : props.content}
            </span>
        </div>
    );
}
