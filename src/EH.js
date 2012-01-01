(function(win, doc, ns, und)
{
    if(ns === und)
    {
        ns = window;
    }
    /**
     * Try-Finally pattern used to remove variables that continue existing after return.
     */
    var Eve,
        EventHandler,
        /**
         * Object where save the no system events.
         * @private
         * @type Object
         */
        oEvents = {},
        /**
         * Cache false boolean value. Helps to reduce final size.
         * @private
         * @type Boolean
         */
        FALSE = false,
        /**
         * Cache true boolean value. Helps to reduce final size.
         * @private
         * @type Boolean
         */
        TRUE = true,
        /**
         * Cache 0 value. Increase readability.
         * @private
         * @type Number
         */
        NUMBER_ZERO = 0,
        /**
         * Cache 0 value. Increase readability reduce size.
         * @private
         * @type Number
         */
        NUMBER_NEG = -1,
        /**
         * Cache '' value. Increase readability reduce size.
         * @private
         * @type String
         */
        EMPTY = '',
        /**
         * Cache null value. Reduce size.
         * @private
         * @type Object
         */
        NULL = null,
        /**
         * Check property exist in DOM.
         * To do it correctly we need to create a new layer.
         * @private
         * @param sProp is the key of the property to check in dom element
         * @return Boolean
         */
        checkPropInDom = function(sProp)
        {
            var oLayer = doc.createElement("div");
            try
            {
                return oLayer[sProp] !== und;
            }finally
            {
                oLayer = null;
            }
        },
        /**
         * Check if oObject is an array or not.
         * @private
         * @param oObject the object to be checked
         * @return Boolean
         */
        isArray = function ( oObject )
        {
            return {}.toString.call( oObject ) === '[object Array]';
        },
        /**
         * Cleans the array if some elements is repeated on the array.
         * @private
         * @param aArray the array to remove repeated elements.
         * @return Array
         */
        unique = function (aArray)
        {
            var aAux        =   [],
                nOuter      =   0,
                nInner      =   0,
                nLenArray   =   aArray.length;

            label:for( ; nOuter < nLenArray; nOuter++ )
            {
                for( ; nInner < aAux.length; nInner++ )
                {
                    if(aAux[ nInner ] === aArray[ nOuter ])
                    {
                        continue label;
                    }
                }
                aAux.push(aArray[ nOuter ]);
            }
            return aAux;
        },
        /**
         * Check if oElement exist in oEvents
         * @private
         * @param oElement is the DOM element to check if exist.
         * @return Boolean
         */
        hasEvents = function ( oElement )
        {
            return oEvents[ oElement ] !== und;
        },
        /**
         * Check if oElement has events of the specified type.
         * @private
         * @param oElement is the DOM element to check if exist.
         * @param sType is the type of event to be checked
         * @return Boolean
         */
        hasEvent = function ( oElement, sType )
        {
            return hasEvents( oElement ) && oEvents[ oElement ][ sType ] !== und;
        },
        /**
         * Check if the event is a system event.
         * @private
         * @param sType is the type of event to be checked
         * @return Boolean
         */
        isSystemEvent = function ( sType )
        {
            return oSystemEvents[ sType ] !== und;
        },
        /**
         * This callback auto executed returns an object with all the events in systems as keys and values.
         * @private
         * @type Object
         */
        oSystemEvents = ( function() {
            var oObject = {},
                aEvents = 'afterprint,beforeprint,beforeonload,blur,error,focus,hashchange,load,message,offline,online,pagehide,pageshow,popstate,redo,resize,storage,undo,unload,change,contextmenu,focusin,focusout,formchange,forminput,input,invalid,select,submit,reset,keydown,keypress,keyup,click,dblclick,drag,dragend,dragenter,dragleave,dragover,dragstart,drop,mousedown,mousemove,mouseout,mouseover,mouseup,mousewheel,scroll,mouseenter,mouseleave,abort,canplay,canplaythrough,durationchange,emptied,ended,loadeddata,loadedmetadata,loadstart,pause,play,playing,progress,ratechange,readystatechange,seeked,seeking,stalled,suspend,timeupdate,volumechange,waiting,cssAnimationKeyframe,webkitTransitionEnd'.split( "," ),
                nEvent = 0,
                nLenEvents = aEvents.length,
                sEvent;
            for( ; nEvent < nLenEvents; nEvent++)
            {
                sEvent = aEvents[nEvent];
                oObject[sEvent] = sEvent;
            }
            try
            {
                return oObject;
            }finally
            {
                oObject = aEvents = nEvent = nLenEvents = sEvent = NULL;
            }
        }()),
        /**
         * Checks for cancelBubble to avoid browser sniffing
         * @private
         * @return Boolean
         */
        isCancelBubble = function ()
        {
            var oEvent = win.event;
            return Boolean(oEvent && oEvent.cancelBubble !== und);
        },
        /**
         * Checks for returnValue to avoid browser sniffing
         * @private
         * @return Boolean
         */
        isReturnValue = function ()
        {
            var oEvent = win.event;
            return Boolean(oEvent && oEvent.returnValue !== und);
        },
        /**
         * Array that contains the possible types of values when pressing mouse button.
         * @private
         * @type Array
         */
        BUTTON_MOUSE_DOWN = [
            function ()
            {
                this.left= NUMBER_ZERO;
                this.central= NULL;
                this.right = 2;
            },
            function ()
            {
                this.left= 1;
                this.central= 4;
                this.right = 2;
            }
        ],
        /**
         * Prevents default process of events.
         * Use Lazy Pattern to be defined
         * @private
         */
        preventDefault = (function()
        {
            if( isReturnValue() )
            {
                return function( eEvent )
                {
                    eEvent.preventDefault();
                }
            }else
            {
                return function( eEvent )
                {
                    eEvent.returnValue = FALSE;
                }
            }
        }()),
        /**
         * Stop bubbling / propagation of events.
         * Use Lazy Pattern to be defined
         * @private
         */
        stopPropagation = ( function ()
        {
            if( isCancelBubble() )
            {
                return function ( eEvent )
                {
                    eEvent.stopPropagation();
                };
            }else
            {
                return function ( eEvent )
                {
                    eEvent.cancelBubble = TRUE;
                };
            }
        }() ),
        /**
         * Properties of event to be defined.
         * Keys are the properties to be defined in Eve, values are the default values if are not defined in the original Event.
         * @private
         * @type Object
         */
        EVENT_PROPERTIES = {
            /**
             * altKey stores the reference to altKey property
             * @type Boolean
             */
            altKey: FALSE,
            /**
             * metaKey stores the reference to metaKey property
             * Used for Apple key
             * @type Boolean
             */
            metaKey: FALSE,
            /**
             * shiftKey stores the reference to shiftKey property
             * @type Boolean
             */
            shiftKey: FALSE,
            /**
             * ctrlKey stores the reference to ctrlKey property
             * @type Boolean
             */
            ctrlKey: FALSE,
            /**
             * button stores the reference to button property
             * @type Number
             */
            button: NUMBER_NEG,
            /**
             * clientX stores the reference to clientX property
             * @type Number
             */
            clientX: NUMBER_ZERO,
            /**
             * clientY stores the reference to clientY property
             * @type Number
             */
            clientY: NUMBER_ZERO,
            /**
             * screenX stores the reference to screenX property
             * @type Number
             */
            screenX: NUMBER_ZERO,
            /**
             * screenY stores the reference to screenY property
             * @type Number
             */
            screenY: NUMBER_ZERO,
            /**
             * pageX stores the reference to pageX property
             * @type Number
             */
            pageX: NUMBER_ZERO,
            /**
             * pageY stores the reference to pageY property
             * @type Number
             */
            pageY: NUMBER_ZERO,
            /**
             * which stores the reference to which property
             * @type Number
             */
            which: NUMBER_ZERO,
            /**
             * type stores the reference to type property
             * @type String
             */
            type: EMPTY,
            /**
             * target stores the reference to target property
             * @type Object
             */
            target: NULL,
            /**
             * relatedTarget stores the reference to relatedTarget property
             * @type Object
             */
            relatedTarget: NULL
        };
    /**
     * Eve
     * this class is used to normalize the event not depending of browser that owns the user
     * @class Eve
     * @constructor
     * @name Eve
     * @param oEvent
     * @version 1.0
     * @author Tomas Corral
     * @return Eve
     * @type object
     */
    Eve = function ( oEvent )
    {
        /**
         * originalEvent stores the reference to the original event
         * @member Eve
         * @type Event
         */
        this.originalEvent = oEvent;
        return this;
    };
    /**
     * Init method must be called to normalize the Eve instance to be used the same way in cross browsing mode.
     * Sets default values if properties are not defined and normalize the Eve object with the original event.
     * @member Eve.prototype
     * @return Eve
     */
    Eve.prototype.init = function ()
    {
        var sKey,
            oDefProp,
            oEvent = this.originalEvent;
        for( sKey in EVENT_PROPERTIES )
        {
            if( EVENT_PROPERTIES.hasOwnProperty( sKey ) )
            {
                oDefProp = EVENT_PROPERTIES[ sKey ];
                this[ sKey ] = oEvent[ sKey ] || oDefProp;
            }
        }
        this.normalize( oEvent );
        return this;
    };
    /**
     * buttonMouseDown returns the correct object to be used to detect the mouse button when pressed down
     * @static
     * @member Eve
     */
    Eve.buttonMouseDown = new BUTTON_MOUSE_DOWN[ Number( isCancelBubble() ) ]();
    /**
     * preventDefault stops the default behaviour on the element where the event is attached
     * @member Eve.prototype
     * @return Eve
     */
    Eve.prototype.preventDefault = function ()
    {
        preventDefault( this.originalEvent );
        return this;
    };
    /**
     * stopPropagation stops bubbling propagation
     * @member Eve.prototype
     * @return Eve
     */
    Eve.prototype.stopPropagation = function ()
    {
        stopPropagation( this.originalEvent );
        return this;
    };
    /**
     * stopImmediatePropagation force the stop bubbling propagation
     * @member Eve.prototype
     * @return Eve
     */
    Eve.prototype.stopImmediatePropagation = function ()
    {
        this.stopPropagation();
        return this;
    };
    /**
     * normalize is the method that returns a normalized event object in cross browsing way.
     * @member Eve.prototype
     * @param oEvent
     * @type Event
     */
    Eve.prototype.normalize = function( oEvent )
    {
        if ( !oEvent.target )
        {
            this.target = oEvent.srcElement || doc;
        }

        if( this.target.nodeType === 3 )
        {
            this.target = oEvent.target.parentNode;
        }

        if( !oEvent.relatedTarget && oEvent.fromElement )
        {
            this.relatedTarget = oEvent.fromElement === oEvent.target ? oEvent.toElement : oEvent.fromElement;
        }

        if( oEvent.pageX === NULL && oEvent.clientX !== NULL )
        {
            var doc = doc.documentElement, body = doc.body;
            this.pageX = oEvent.clientX + ( ( doc && doc.scrollLeft ) || ( body && body.scrollLeft ) || 0 ) - ( ( doc && doc.clientLeft ) || ( body && body.clientLeft ) || 0 );
            this.pageY = oEvent.clientY + ( ( doc && doc.scrollTop )  || ( body && body.scrollTop )  || 0 ) - ( ( doc && doc.clientTop )  || ( body && body.clientTop )  || 0 );
        }

        if( !oEvent.which && (( oEvent.charCode || oEvent.charCode === 0 ) ? oEvent.charCode : oEvent.keyCode ))
        {
            this.which = oEvent.charCode || oEvent.keyCode;
        }

        if( !oEvent.metaKey && oEvent.ctrlKey )
        {
            this.metaKey = oEvent.ctrlKey;
        }

        if( !oEvent.which && oEvent.button !== und )
        {
            this.which = ( oEvent.button & 1 ? 1 : ( oEvent.button & 2 ? 3 : ( oEvent.button & 4 ? 2 : 0 ) ) );
        }
    };
    /**
     * instance is the method to be called each time we need a normalized event object
     * @param {Object} oEvent
     * @return Eve instance
     */
    Eve.instance = function( oEvent )
    {
        return new Eve( oEvent ).init();
    };


    /**
     * EventHandler
     * Class that manages all the events
     * @class EventHandler
     * @constructor
     * @name EventHandler
     * @version 1.0
     * @author Tomas Corral
     * @static
     */
    EventHandler = function (){};
    /**
     * Checks if the element can scroll to detect if the content is loaded.
     * @param oElement
     * @param fpCallback
     */
    EventHandler.hasVerticalScroll = function(oElement, fpCallback)
    {
        if(!oElement)
        {
            return;
        }
        oElement.scrollTop = 1;
        if(oElement.scrollTop === 1)
        {
            oElement.scrollTop = 0;
            fpCallback.call(oElement);
        }
    };
    /**
     * DOMLoad checks for the correct way to detect the loading of the DOM
     * Use LazyPatter.
     * Inspired by Dojo DOMLoad way.
     * You can pass any functions you need to be executed (to the result function of the automatic executed) when the DOM is load
     * @param Function / s
     */
    EventHandler.DOMLoad = (function ()
    {
        var bDOMLoaded = false;
        var nDOMLoadTimer = null;
        var aFunctionsToCall = [];
        var oAddedStrings = {};
        var fpErrorHandling = null;
        var execFunctions = function ()
        {
            var nFunction = 0;
            var nLenFunctions = aFunctionsToCall.length;

            for (; nFunction < nLenFunctions; nFunction++)
            {
                try
                {
                    aFunctionsToCall[nFunction]();
                }
                catch (erError)
                {
                    if (fpErrorHandling && typeof fpErrorHandling === "function")
                    {
                        fpErrorHandling(erError);
                    }
                }
            }
            aFunctionsToCall = [];
        };
        var domHasLoaded = function ()
        {
            if (bDOMLoaded)
            {
                return;
            }
            bDOMLoaded = true;
            execFunctions();
        };
        /* Mozilla, Chrome, Opera */
        if (document.addEventListener)
        {
            document.addEventListener("DOMContentLoaded", domHasLoaded, false);
        }
        /* Safari, iCab, Konqueror */
        if (/KHTML|WebKit|iCab/i.test(navigator.userAgent))
        {
            nDOMLoadTimer = setInterval(function ()
            {
                if (/loaded|complete/i.test(document.readyState))
                {
                    domHasLoaded();
                    clearInterval(nDOMLoadTimer);
                }
            }, 10);
        }
        /* Other web browsers */
        window.onload = domHasLoaded;

        return {
            DOMReady : function ()
            {
                var nArgument = 0;
                var nLenArguments = arguments.length;
                var fpRef = null;

                for (; nArgument < nLenArguments; nArgument++)
                {
                    fpRef = arguments[nArgument];
                    if (!fpRef.DOMReady && !oAddedStrings[fpRef])
                    {
                        fpRef.DOMReady = true;
                        aFunctionsToCall.push(fpRef);
                    }
                }
                if (bDOMLoaded)
                {
                    execFunctions();
                }
            },
            setErrorHandling : function (funcRef)
            {
                fpErrorHandling = funcRef;
            }
        };
    }());
    /**
     * Returns the callback to be used in callbacks.
     * @static
     * @param aAux
     * @param fp_Function
     * @param oElement
     * @return Function
     */
    EventHandler.getHandler = function ( aAux, fp_Function, oElement )
    {
        return function ( event )
        {
            event = event || win.event;

            var oEvent = Eve.instance( event );
            aAux.unshift( oEvent );

            if(fp_Function.apply( oElement, aAux ) === FALSE)
            {
                oEvent.stopPropagation().preventDefault();
            }
        };
    };
    /**
     * Using the sAddMethod to use the same callback to have different behaviours (Cross-Browsing)
     * @static
     * @param sAddMethod
     * @return Function
     */
    EventHandler.addEventCallback = function ( sAddMethod )
    {
        return function( oElement, aData, sEvent, fpFunction, bUseCapture )
        {
            var aAux = [],
                a_Data = aData,
                s_Event = sEvent,
                fp_Function = fpFunction,
                b_UseCapture = bUseCapture,
                fpFunctionWithEvent;

            if( !isArray( aData ) )
            {
                a_Data = [];
                s_Event = aData;
                fp_Function = sEvent;
                b_UseCapture = fpFunction;
            }
            aAux.push(a_Data);

            fpFunctionWithEvent	= EventHandler.getHandler(aAux, fp_Function, oElement);

            EventHandler.bind( oElement, s_Event, fp_Function );

            if( isSystemEvent( s_Event ) )
            {
                oElement[sAddMethod]( (sAddMethod === 'attachEvent' ? 'on' : EMPTY) + s_Event, fpFunctionWithEvent, bUseCapture === und ? FALSE : bUseCapture);
                return fpFunctionWithEvent;
            }else
            {
                return fp_Function;
            }
        };
    };
    /**
     * Auto executed function to return the correct callback and not to check on each execution the type of callback to be used.
     * Use Lazy Pattern to be used.
     * @static
     * @return Function
     */
    EventHandler.addEvent = ( function ()
    {
        var sAddMethod, sAttach = 'attachEvent';
        if( checkPropInDom( sAttach ) )
        {
            sAddMethod = sAttach;
        }else
        {
            sAddMethod = 'addEventListener';
        }
        return  EventHandler.addEventCallback(sAddMethod);
    }() );
    /**
     * Using the sRemoveMethod to use the same callback to have different behaviours (Cross-Browsing)
     * If no fpFunction is supplied is because we want to remove all the callbacks of this events
     * @static
     * @param sRemoveMethod
     * @return Function
     */
    EventHandler.removeEventCallback = function ( sRemoveMethod )
    {
        return function( oElement, sEvent, fpFunction, bUseCapture )
        {
            if(fpFunction === und)
            {
                EventHandler.removeAllCallbacks(oElement, sEvent);
            }else
            {
                EventHandler.unbind( oElement, sEvent, fpFunction );
                if( isSystemEvent( sEvent ) )
                {
                    oElement[sRemoveMethod]( (sRemoveMethod === 'detachEvent' ? 'on' : EMPTY) + sEvent, fpFunction, bUseCapture === und ? FALSE : bUseCapture );
                }
            }
        };
    };
    /**
     * Auto executed function to return the correct callback and not to check on each execution the type of callback to be used.
     * Use Lazy Pattern to be used.
     * @static
     * @return Function
     */
    EventHandler.removeEvent = ( function ()
    {
        var sRemoveMethod, sDetach = 'detachEvent';
        if( checkPropInDom( sDetach ) )
        {
            sRemoveMethod = sDetach;
        }else
        {
            sRemoveMethod = 'removeEventListener';
        }
        return EventHandler.removeEventCallback(sRemoveMethod);
    }() );
    /**
     * Removes all the assigned callbacks to one event type on the selected element.
     * @static
     * @param oElement
     * @param sEventType
     */
    EventHandler.removeAllCallbacks = function ( oElement, sEventType )
    {
        var oCallbacks, sKey, fpFunction;
        if( !hasEvent( oElement, sEventType ))
        {
            return;
        }
        oCallbacks = oEvents[ oElement ][ sEventType ];
        if( isSystemEvent( sEventType ) )
        {
            for( sKey in oCallbacks )
            {
                if( oCallbacks.hasOwnProperty( sKey ) )
                {
                    fpFunction = oCallbacks[ sKey ];
                    this.removeEvent( oElement, sEventType, fpFunction, false );
                }
            }
        }
        oEvents[ oElement ][ sEventType ] = [];
    };
    /**
     * Adds events to the oEvents object to be saved and triggered when needed.
     * Checks if the Element has or not any event (if not it creates the holder)
     * Check if the Element with the selected events has callbacks or not (if not it creates the holder)
     * @static
     * @param oElement
     * @param sType
     * @param nIdentifier
     * @param fpPointer
     */
    EventHandler._add = function (oElement, sType, nIdentifier, fpPointer )
    {
        if( !hasEvents( oElement ) )
        {
            oEvents[ oElement ] = [];
        }
        if( !hasEvent( oElement, sType ) )
        {
            oEvents[ oElement ][ sType ] = [];
        }

        oEvents[ oElement ][ sType ][ nIdentifier ]  = fpPointer;
    };
    /**
     * Bind add the custom events to the oObject elements.
     * sTypes can manage more than one type.
     * @static
     * @param oElement
     * @param sTypes
     * @param fpPointer
     * @return Number
     */
    EventHandler.bind = function ( oElement, sTypes, fpPointer )
    {
        var aTypes = unique( sTypes.split( "," ) ),
            nType = 0,
            nLenType = aTypes.length,
            nIdentifier = Math.random() * +new Date();

        for( ; nType < nLenType; nType++ )
        {
            EventHandler._add( oElement, aTypes[ nType ], nIdentifier, fpPointer );
        }

        try
        {
            return nIdentifier;
        }finally
        {
            aTypes = nType = nLenType = nIdentifier = NULL;
        }
    };
    /**
     * Removes events from oEvents object.
     * Checks if the Element has or not any event (if not return)
     * Check if the Element with the selected events has callbacks or not (if not return)
     * @static
     * @param oElement
     * @param sType
     * @param nIdentifier
     */
    EventHandler._remove = function ( oElement, sType, nIdentifier )
    {
        if( !hasEvent( oElement, sType ))
        {
            return;
        }

        if(nIdentifier !== und)
        {
            delete oEvents[oElement][sType][nIdentifier];
        }else
        {
            oEvents[oElement][sType] = [];
        }
    };
    /**
     * Unbind removes the custom events from oObject.
     * sTypes can manage more than one type.
     * @static
     * @param oElement
     * @param sTypes
     * @param nIdentifier  Could be a numeric identifier or a callback.
     */
    EventHandler.unbind = function ( oElement, sTypes, nIdentifier )
    {
        var aTypes = unique( sTypes.split( "," ) ),
            nType = 0,
            sKey,
            sType,
            fpHandler,
            oEvs,
            nLenType = aTypes.length;
        if(typeof nIdentifier === "number")
        {
            for( ; nType < nLenType; nType++ )
            {
                sType = aTypes[ nType ];
                EventHandler._remove( oElement, sType, nIdentifier );
            }
        }else
        {
            for( ; nType < nLenType; nType++ )
            {
                sType = aTypes[nType];
                if(hasEvent(oElement, aTypes[nType]))
                {
                    oEvs = oEvents[oElement][sType];
                    for( sKey in  oEvs)
                    {
                        if(oEvs.hasOwnProperty( sKey ))
                        {
                            fpHandler = oEvs[sKey];
                            if( fpHandler === nIdentifier )
                            {
                                EventHandler._remove( oElement, sType, sKey );
                            }
                        }
                    }
                }

            }
        }
        aTypes = nType = fpHandler = sKey = nLenType = NULL;
    };
    /**
     * Trigger checks if oElement has any event to be triggered.
     * Calls all the assigned events
     * @param oElement
     * @param sType
     * @param aData
     */
    EventHandler.trigger = function ( oElement, sType, aData )
    {
        var aEvents, nIdentifier;
        if( !hasEvent( oElement, sType ))
        {
            return;
        }
        if(aData === und)
        {
            aData = [];
        }
        aEvents = oEvents[ oElement ][ sType ];

        for( nIdentifier in aEvents )
        {
            if( aEvents.hasOwnProperty( nIdentifier ) )
            {
                aEvents[ nIdentifier ].apply( oElement, aData );
            }
        }
    };
    /**
     * Expose API to namespace
     * Used Module revealed design pattern.
     */
    ns.EH = {
        buttonTypes: Eve.buttonMouseDown,
        ready: DOMLoad,
        bind: EventHandler.addEvent,
        unbind: EventHandler.removeEvent,
        trigger: EventHandler.trigger
    };
}(window, document));