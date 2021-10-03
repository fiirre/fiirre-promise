class Promise {
    static PENDING = 'pending'
    static FULFILLED = 'fulfilled'
    static REJECTED = 'rejected'
    static  deferred() {
        let defer = {}
        defer.promise = new Promise((resolve, reject) => {
            defer.resolve = resolve
            defer.reject = reject
        });
        return defer
    }
    static resolvePromise(thenPromise, x, resolve, reject) {
        if (x === thenPromise)  return reject(new TypeError('循环引用'));
        if (x && (typeof x === 'function' || typeof x === 'object')) {
           let called = false
            try {
				let then = x.then
				if (typeof then === 'function') {
					then.call(x,
						y => {
							if (called) return
							called = true
							Promise.resolvePromise(thenPromise, y, resolve, reject);
						},
						r => {
							if (called) return
							called = true
							reject(r)
						}
					);
				} else {
					resolve(x)
				}
			} catch (e) {
				if (called) return
				called = true
				reject(e)
			}
        } else {
          resolve(x)
        }
    }
  	static setTimeoutResolvePromise (callback, data) {
		let {promise,resolve, reject} = data
		setTimeout(() => {
			try {
				Promise.resolvePromise(promise, callback(this.data), resolve, reject);
			} catch (e) {
				reject(e)
			}
		});
  	}
  	static directFnConstructor(state) {
		return value => {
			if (this.state !== Promise.PENDING) return
			this.state = state
			this.data = value
			this.state === Promise.FULFILLED ? this.onFulfilledCallbacks.map(fn => fn()):this.onRejectedCallbacks.map(fn => fn())
		}
	  }
	static resolve(value) {
		return new Promise((resolve, reject) => {
			resolve(value)
		})
	}
	static reject(value) {
		return new Promise((resolve, reject) => {
			reject(value)
		})
	}
	static all(promiseArr) {
		let len = promiseArr.length
		let i = 0
		let count  = 0
		let arr = []
		return new Promise((resolve,reject)=>{
			while(i < len) {
				promiseArr[i++].then((value) => {
					arr[count] = value
					count++
					if(count === len){
						resolve(arr)
					}
				}, reject)
			}
		})
		
	}
	static race(promiseArr) {
		let len = promiseArr.length
		let i = 0
		return new Promise((resolve,reject)=>{
			while(i < len) {
				promiseArr[i++].then(resolve, reject)
			}
		})
	}
	constructor(executor) {
		this.state = Promise.PENDING
		this.data = null
		this.onFulfilledCallbacks = []
		this.onRejectedCallbacks = []
		const resolve = Promise.directFnConstructor.call(this, Promise.FULFILLED)
		const reject = Promise.directFnConstructor.call(this, Promise.REJECTED)
		try {
			executor(resolve, reject)
		} catch (e) {
			reject(e)
		}
	}
  	then(onFulfilled, onRejected) {
		onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
		onRejected = typeof onRejected === 'function' ? onRejected: reason => {throw reason};
		let data = Promise.deferred()
		if (this.state !== Promise.PENDING) {
			let fn = this.state === Promise.REJECTED ? onRejected : onFulfilled
			Promise.setTimeoutResolvePromise.call(this, fn, data)
		}
		else if (this.state === Promise.PENDING) {
			this.onFulfilledCallbacks.push(_ => {
			Promise.setTimeoutResolvePromise.call(this, onFulfilled, data)
			});
			this.onRejectedCallbacks.push(_ => {
			Promise.setTimeoutResolvePromise.call(this, onRejected, data)
			});
		}
		return data.promise
		
	}
	catch(onRejected) {
		return this.then(null, onRejected)
	}
	finally(fn) {
		return this.then(fn,fn)
	}
}
module.exports = Promise
