/*
抽象父类AbstractPlayer
统一抽取选手、管理员公共属性：编号、姓名、年龄、是否禁赛黑名单；
定义抽象方法showInfo()，强制子类实现自身身份信息展示；
提供公共方法打印基础身份信息，代码复用
*/

public abstract class AbstractPlayer {

    /*protected 是面向对象编程中的访问修饰符，用于控制类成员（字段、方法、构造函数等）的可见性。
    它的核心设计意图是：允许子类访问，但阻止外部无关代码访问。 */
    protected int id;
    protected String name;
    protected int age;
    protected boolean banned;

    public AbstractPlayer(int id, String name, int age) {
        this.id = id;
        this.name = name;
        this.age = age;
        this.banned = false;
    }

    public abstract void showInfo();

    /*提供公共方法打印基础身份信息，代码复用 */
    public void printBasicInfo() {
        System.out.println("编号: " + id);
        System.out.println("姓名: " + name);
        System.out.println("年龄: " + age);
        System.out.println("黑名单状态: " + (banned ? "禁赛" : "正常"));
    }

    /*获取的编号、姓名、年龄、是否禁赛黑名单getter方法 */

    public int getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public boolean isBanned() {
        return banned;
    }

    public void setBanned(boolean banned) {
        this.banned = banned;
    }
}
