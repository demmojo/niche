const obj = {
  _user: { uid: "123" },
  get currentUser() {
    return this._user;
  },
  signIn() {
    this._user = { uid: "456" };
  },
};

const proxy = new Proxy(obj, {
  get(target, prop) {
    const value = target[prop];
    if (typeof value === "function") {
      return value.bind(target);
    }
    return value;
  },
});

console.log(proxy.currentUser);
